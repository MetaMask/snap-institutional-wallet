import { emitSnapKeyringEvent, KeyringEvent } from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import { renderErrorMessage } from './features/error-message/render';
import {
  MAX_TRANSACTION_AGE,
  MAX_SIGNED_MESSAGE_AGE,
} from './lib/custodian-types/constants';
import { TransactionHelper } from './lib/helpers/transaction';
import {
  type SignedMessageRequest,
  type TransactionRequest,
  type CustodialSnapRequest,
  TransactionDetails,
} from './lib/structs/CustodialKeyringStructs';
import type { ICustodianApi } from './lib/types';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import type { EthSignTransactionRequest } from './lib/types/EthSignTransactionRequest';
import logger from './logger';
import type { KeyringStateManager } from './stateManagement';

type KeyringFacade = {
  getCustodianApiForAddress: (address: string) => Promise<ICustodianApi>;
  getAccount: (
    accountId: string,
  ) => Promise<CustodialKeyringAccount | undefined>;
};

export class RequestManager {
  #keyringFacade: KeyringFacade;

  #stateManager: KeyringStateManager;

  constructor(stateManager: KeyringStateManager, keyringFacade: KeyringFacade) {
    this.#stateManager = stateManager;
    this.#keyringFacade = keyringFacade;
  }

  async upsertRequest(
    request: CustodialSnapRequest<SignedMessageRequest | TransactionRequest>,
  ): Promise<void> {
    return this.#stateManager.upsertRequest(request);
  }

  async listRequests(): Promise<
    CustodialSnapRequest<SignedMessageRequest | TransactionRequest>[]
  > {
    return this.#stateManager.listRequests();
  }

  async clearAllRequests(): Promise<void> {
    return this.#stateManager.clearAllRequests();
  }

  async getChainIdFromPendingRequest(id: string): Promise<string> {
    const transactionRequest = await this.getRequestParams(id);
    if (!transactionRequest.chainId) {
      throw new Error(`Request ${id} has no chainId`);
    }

    return transactionRequest.chainId;
  }

  async getRequestParams(id: string): Promise<EthSignTransactionRequest> {
    const request = await this.#stateManager.getRequest(id);
    if (!request) {
      throw new Error(`Request ${id} not found`);
    }

    const requestParams = request.keyringRequest.request.params;

    if (!Array.isArray(requestParams) || requestParams.length === 0) {
      throw new Error(`Request ${id} has invalid params`);
    }

    return requestParams[0] as EthSignTransactionRequest;
  }

  async poll(): Promise<void> {
    const pendingRequests = (await this.listRequests()).filter(
      (request) => !request.fulfilled,
    );

    for (const request of pendingRequests) {
      switch (request.type) {
        case 'message':
          try {
            await this.pollSignedMessage(
              request.keyringRequest.id,
              request as CustodialSnapRequest<SignedMessageRequest>,
            );
          } catch (error: any) {
            logger.info(
              `Error polling signed message request ${request.keyringRequest.id}`,
            );
            logger.error(error); // @audit infoleak?
          }
          break;
        case 'transaction':
          try {
            await this.pollTransaction(
              request.keyringRequest.id,
              request as CustodialSnapRequest<TransactionRequest>,
            );
          } catch (error: any) {
            logger.info(
              `Error polling transaction request ${request.keyringRequest.id}`,
            );
            logger.error(error); // @audit - infoleak
          }
          break;
        default:
          // logger.debug(`Unknown request type: ${request.type}`);
          break;
      } // @audit what happens to other txtypes? are they kept forever? should they be cleaned up and error reported?
    }
  }

  async pollTransaction(
    requestId: string,
    request: CustodialSnapRequest<TransactionRequest>,
  ): Promise<void> {
    const { account } = request.keyringRequest;
    const keyringAccount = await this.#keyringFacade.getAccount(account);

    if (!keyringAccount) {
      throw new Error(`Account ${account} not found`);
    }

    const { address } = keyringAccount;

    const custodianApi = await this.#keyringFacade.getCustodianApiForAddress(
      address,
    );

    const { custodianTransactionId } = request.transaction;

    // Check if lastUpdates is older than MAX_TRANSACTION_AGE
    if (request.lastUpdated < Date.now() - MAX_TRANSACTION_AGE) {
      logger.info(
        `Transaction ${custodianTransactionId} last updated more than ${MAX_TRANSACTION_AGE}ms (last updated ${
          Date.now() - request.lastUpdated
        }ms ago), removing request`,
      );
      await this.emitRejectedEvent(requestId);
      await this.#stateManager.removeRequest(requestId);
      return;
    }

    const transactionResponse = await custodianApi.getTransaction(
      address,
      custodianTransactionId,
    );

    assert(transactionResponse, TransactionDetails);

    if (
      transactionResponse?.transactionStatus.finished &&
      !transactionResponse.transactionStatus.success
    ) {
      await this.emitRejectedEvent(requestId);
      await this.#stateManager.removeRequest(requestId);
      return;
    }

    if (
      (transactionResponse?.transactionStatus.finished &&
        transactionResponse.transactionStatus.success) ||
      transactionResponse?.signedRawTransaction
    ) {
      const chainId = await this.getChainIdFromPendingRequest(requestId);

      const signature = await TransactionHelper.getTransactionSignature(
        transactionResponse,
        chainId,
      );
      // Check that the transaction was not altered by the custodian
      // Do not do this for externally published transactions
      if (transactionResponse.signedRawTransaction) {
        const validationResult = TransactionHelper.validateTransaction(
          await this.getRequestParams(requestId),
          transactionResponse,
        );

        if (!validationResult.isValid) {
          // First show a dialog with the error message
          if (validationResult.error) {
            const errorMessage = `Transaction ${custodianTransactionId} was signed by custodian but failed validation: ${validationResult.error}`;
            await renderErrorMessage(errorMessage);
          }
          await this.emitRejectedEvent(requestId);
          await this.#stateManager.removeRequest(requestId);
          return;
        }
      }

      const updatedTransaction = {
        ...request,
        fulfilled: true,
        result: signature,
        lastUpdated: Date.now(),
      };
      await this.#stateManager.upsertRequest(updatedTransaction);
      await this.emitApprovedEvent(requestId, signature);
      await this.#stateManager.removeRequest(requestId);
    } else if (transactionResponse) {
      // Check for any changes to request.transaction relative the response
      // Restrict to the status, gasPrice, maxFeePerGas, maxPriorityFeePerGas, gasLimit, nonce
      const updatedTransaction: CustodialSnapRequest<TransactionRequest> = {
        ...request,
        transaction: {
          ...request.transaction,
          transactionStatus: {
            finished: transactionResponse.transactionStatus.finished ?? false,
            success: transactionResponse.transactionStatus.success ?? false,
            displayText:
              transactionResponse.transactionStatus.displayText ?? '',
            submitted: transactionResponse.transactionStatus.submitted ?? false,
            reason: transactionResponse.transactionStatus.reason ?? '',
            signed: transactionResponse.transactionStatus.signed ?? false,
          },
          ...(transactionResponse.gasPrice && {
            gasPrice: transactionResponse.gasPrice,
          }),
          ...(transactionResponse.maxFeePerGas && {
            maxFeePerGas: transactionResponse.maxFeePerGas,
          }),
          ...(transactionResponse.maxPriorityFeePerGas && {
            maxPriorityFeePerGas: transactionResponse.maxPriorityFeePerGas,
          }),
          ...(transactionResponse.gasLimit && {
            gasLimit: transactionResponse.gasLimit,
          }),
          ...(transactionResponse.nonce && {
            nonce: transactionResponse.nonce,
          }),
          ...(transactionResponse.to && { to: transactionResponse.to }),
          ...(transactionResponse.value && {
            value: transactionResponse.value,
          }),
          ...(transactionResponse.data && { data: transactionResponse.data }),
          ...(transactionResponse.chainId && {
            chainId: transactionResponse.chainId,
          }),
          ...(transactionResponse.from && { from: transactionResponse.from }),
        },
      };
      await this.#stateManager.upsertRequest(updatedTransaction);
    }
  }

  async pollSignedMessage(
    requestId: string,
    request: CustodialSnapRequest<SignedMessageRequest>,
  ): Promise<void> {
    const { account } = request.keyringRequest;
    const keyringAccount = await this.#keyringFacade.getAccount(account);

    if (!keyringAccount) {
      throw new Error(`Account ${account} not found`);
    }

    const { address } = keyringAccount;

    const custodianApi = await this.#keyringFacade.getCustodianApiForAddress(
      address,
    );

    // Check if lastUpdates is older than MAX_TRANSACTION_AGE
    if (request.lastUpdated < Date.now() - MAX_SIGNED_MESSAGE_AGE) {
      logger.info(
        `Signed Message ${
          request.message.id
        } last updated more than ${MAX_SIGNED_MESSAGE_AGE}ms (last updated ${
          Date.now() - request.lastUpdated
        }ms ago), removing request`,
      );
      await this.emitRejectedEvent(requestId);
      await this.#stateManager.removeRequest(requestId);
      return;
    }

    const signedMessageResponse = await custodianApi.getSignedMessage(
      address,
      request.message.id,
    );

    if (signedMessageResponse?.status?.finished) {
      if (signedMessageResponse.status.success) {
        const updatedSignedMessage = {
          ...request,
          fulfilled: true,
          signature: signedMessageResponse.signature,
          lastUpdated: Date.now(),
        };
        await this.#stateManager.upsertRequest(updatedSignedMessage);
        await this.emitApprovedEvent(
          requestId,
          signedMessageResponse.signature,
        );
      } else {
        await this.emitRejectedEvent(requestId);
      }
      await this.#stateManager.removeRequest(requestId);
    }
  }

  async emitApprovedEvent(id: string, result: Json): Promise<void> {
    try {
      await emitSnapKeyringEvent(snap, KeyringEvent.RequestApproved, {
        id,
        result,
      });
    } catch (error: any) {
      /*
       * we are looking for Request '${id}' not found, that means the request
       * was removed from the snap keyring before we could emit the event
       * So we should remove the request from the state and not throw an error
       */

      if (error.message.includes(`Request '${id}' not found`)) {
        logger.info(`Request '${id}' not found, removing from state`);
        await this.#stateManager.removeRequest(id);
      } else {
        throw error;
      }
    }
  }

  async emitRejectedEvent(id: string): Promise<void> {
    try {
      await emitSnapKeyringEvent(snap, KeyringEvent.RequestRejected, {
        id,
      });
    } catch (error: any) {
      if (error.message.includes(`Request '${id}' not found`)) {
        logger.info(`Request '${id}' not found, removing from state`);
        await this.#stateManager.removeRequest(id);
      } else {
        throw error;
      }
    }
  }
}
