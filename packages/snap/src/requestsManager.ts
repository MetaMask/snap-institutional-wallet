import { emitSnapKeyringEvent, KeyringEvent } from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';
import { assert } from '@metamask/superstruct';

import config from './config';
import type { EncryptedStateManager } from './encryptedStateManagement';
import { renderErrorMessage } from './features/error-message/render';
import {
  MAX_TRANSACTION_AGE,
  MAX_SIGNED_MESSAGE_AGE,
} from './lib/custodian-types/constants';
import { TransactionHelper } from './lib/helpers/transaction';
import { TransactionDetails } from './lib/structs/CustodialKeyringStructs';
import type {
  CustodialSnapRequest,
  MutableTransactionSearchParameters,
  SignedMessageRequest,
  TransactionRequest,
} from './lib/structs/CustodialKeyringStructs';
import type { ICustodianApi } from './lib/types';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import type { EthSignTransactionRequest } from './lib/types/EthSignTransactionRequest';
import logger from './logger';
import type { UnencryptedStateManager } from './unencryptedStateManagement';

type KeyringFacade = {
  getCustodianApiForAddress: (address: string) => Promise<ICustodianApi>;
  getAccount: (
    accountId: string,
  ) => Promise<CustodialKeyringAccount | undefined>;
};

export class RequestManager {
  #keyringFacade: KeyringFacade;

  #encryptedStateManager: EncryptedStateManager;

  #unencryptedStateManager: UnencryptedStateManager;

  constructor(
    encryptedStateManager: EncryptedStateManager,
    unencryptedStateManager: UnencryptedStateManager,
    keyringFacade: KeyringFacade,
  ) {
    this.#encryptedStateManager = encryptedStateManager;
    this.#unencryptedStateManager = unencryptedStateManager;
    this.#keyringFacade = keyringFacade;
  }

  async upsertRequest(
    request: CustodialSnapRequest<SignedMessageRequest | TransactionRequest>,
  ): Promise<void> {
    return this.#encryptedStateManager.upsertRequest(request);
  }

  async listRequests(): Promise<
    CustodialSnapRequest<SignedMessageRequest | TransactionRequest>[]
  > {
    return this.#encryptedStateManager.listRequests();
  }

  async clearAllRequests(): Promise<void> {
    return this.#encryptedStateManager.clearAllRequests();
  }

  async getChainIdFromPendingRequest(id: string): Promise<string> {
    const transactionRequest = await this.getRequestParams(id);
    if (!transactionRequest.chainId) {
      throw new Error(`Request ${id} has no chainId`);
    }

    return transactionRequest.chainId;
  }

  /**
   * Gets a transaction request that matches the specified parameters.
   * @param params - The transaction parameters to search for.
   * @returns The most recently updated transaction request matching the parameters.
   */
  async getMutableTransactionParameters(
    params: MutableTransactionSearchParameters,
  ): Promise<CustodialSnapRequest<SignedMessageRequest | TransactionRequest>> {
    const requests = await this.listRequests();

    const transactionRequests = requests.filter((request) => {
      return Boolean(
        (request as CustodialSnapRequest<TransactionRequest>).transaction,
      );
    }) as CustodialSnapRequest<TransactionRequest>[];

    const matchingRequests = transactionRequests.filter((request) => {
      // Look in the original request params, not the updated ones
      const requestParams = request.keyringRequest.request.params;
      if (!Array.isArray(requestParams) || requestParams.length === 0) {
        return false;
      }
      const txParams = requestParams[0] as EthSignTransactionRequest;
      return (
        txParams.from === params.from &&
        txParams.to === params.to &&
        txParams.value === params.value &&
        txParams.data === params.data &&
        txParams.chainId === params.chainId
      );
    });

    // Use the last updated request
    const matchingRequest = matchingRequests.sort(
      (a, b) => b.lastUpdated - a.lastUpdated,
    )[0];

    if (!matchingRequest) {
      throw new Error('No matching transaction request found');
    }

    return matchingRequest;
  }

  async getRequestParams(id: string): Promise<EthSignTransactionRequest> {
    const request = await this.#encryptedStateManager.getRequest(id);
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
    const numberOfAccounts =
      await this.#unencryptedStateManager.getNumberOfAccounts();

    // If there are no accounts, there are no requests to poll
    // So we don't need to unlock the client

    if (numberOfAccounts === 0) {
      return;
    }

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
            if (config.dev) {
              logger.error(error);
            }
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
            if (config.dev) {
              logger.error(error);
            }
          }
          break;
        default:
          logger.debug(
            `Unknown request type: ${String((request as any).type)}`,
          );
          // Delete request
          await this.#encryptedStateManager.removeRequest(
            (request as any).keyringRequest.id,
          );
          break;
      }
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
      await this.#encryptedStateManager.removeRequest(requestId);
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
      logger.info('Removing failed transaction request', requestId);
      await this.#encryptedStateManager.removeRequest(requestId);
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
          await this.#encryptedStateManager.removeRequest(requestId);
          return;
        }
      }

      const updatedTransaction = {
        ...this.#updateTransactionRequest(request, transactionResponse),
        fulfilled: true,
        result: signature,
        lastUpdated: Date.now(),
      };
      await this.#encryptedStateManager.upsertRequest(updatedTransaction);
      await this.emitApprovedEvent(requestId, signature);
    } else if (transactionResponse) {
      const updatedTransaction = this.#updateTransactionRequest(
        request,
        transactionResponse,
      );
      await this.#encryptedStateManager.upsertRequest(updatedTransaction);
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
      await this.#encryptedStateManager.removeRequest(requestId);
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
        await this.#encryptedStateManager.upsertRequest(updatedSignedMessage);
        await this.emitApprovedEvent(
          requestId,
          signedMessageResponse.signature,
        );
      } else {
        await this.emitRejectedEvent(requestId);
      }
      await this.#encryptedStateManager.removeRequest(requestId);
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
        await this.#encryptedStateManager.removeRequest(id);
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
        await this.#encryptedStateManager.removeRequest(id);
      } else {
        throw error;
      }
    }
  }

  #updateTransactionRequest(
    request: CustodialSnapRequest<TransactionRequest>,
    transactionResponse: TransactionDetails,
  ): CustodialSnapRequest<TransactionRequest> {
    const updatedTransaction: CustodialSnapRequest<TransactionRequest> = {
      ...request,
      transaction: {
        ...request.transaction,
        transactionStatus: {
          finished: transactionResponse.transactionStatus.finished ?? false,
          success: transactionResponse.transactionStatus.success ?? false,
          displayText: transactionResponse.transactionStatus.displayText ?? '',
          submitted: transactionResponse.transactionStatus.submitted ?? false,
          reason: transactionResponse.transactionStatus.reason ?? '',
          signed: transactionResponse.transactionStatus.signed ?? false,
        },
        ...(transactionResponse.transactionHash && {
          transactionHash: transactionResponse.transactionHash,
        }),
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

    return updatedTransaction;
  }
}
