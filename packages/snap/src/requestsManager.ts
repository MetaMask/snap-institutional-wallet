import { emitSnapKeyringEvent, KeyringEvent } from '@metamask/keyring-api';
import type { Json } from '@metamask/snaps-sdk';

import { TransactionHelper } from './lib/helpers/transaction';
import type { ICustodianApi } from './lib/types';
import type {
  CustodialSnapRequest,
  KeyringState,
  SignedMessageRequest,
  TransactionRequest,
} from './lib/types/CustodialKeyring';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import type { EthSignTransactionRequest } from './lib/types/EthSignTransactionRequest';
import { saveState } from './stateManagement';

type KeyringFacade = {
  getCustodianApiForAddress: (address: string) => Promise<ICustodianApi>;
  getAccount: (accountId: string) => Promise<CustodialKeyringAccount>;
};

export class RequestManager {
  #state: KeyringState;

  #keyringFacade: KeyringFacade;

  constructor(state: KeyringState, keyringFacade: KeyringFacade) {
    this.#state = state;
    this.#keyringFacade = keyringFacade;
  }

  listRequests(): CustodialSnapRequest<
    SignedMessageRequest | TransactionRequest
  >[] {
    return Object.values(this.#state.requests);
  }

  async addPendingRequest(
    request: CustodialSnapRequest<SignedMessageRequest | TransactionRequest>,
  ): Promise<void> {
    this.#state.requests[request.keyringRequest.id] = request;
    await saveState(this.#state);
  }

  async removePendingRequest(id: string): Promise<void> {
    delete this.#state.requests[id];
    await saveState(this.#state);
  }

  async getChainIdFromPendingRequest(id: string): Promise<string> {
    if (!this.#state.requests[id]) {
      throw new Error(`Request ${id} not found`);
    }

    const requestParams =
      this.#state.requests[id]!.keyringRequest.request.params;

    if (!Array.isArray(requestParams) || requestParams.length === 0) {
      throw new Error(`Request ${id} has invalid params`);
    }

    const transactionRequest = requestParams[0] as EthSignTransactionRequest;
    if (!transactionRequest.chainId) {
      throw new Error(`Request ${id} has no chainId`);
    }

    return transactionRequest.chainId;
  }

  async clearAllRequests(): Promise<void> {
    this.#state.requests = {};
    await saveState(this.#state);
  }

  async poll(): Promise<void> {
    const pendingRequests = this.listRequests().filter(
      (request) => !request.fulfilled,
    );

    for (const request of pendingRequests) {
      if (request.type === 'signedMessage') {
        await this.pollSignedMessage(
          request.keyringRequest.id,
          request as CustodialSnapRequest<SignedMessageRequest>,
        );
      } else if (request.type === 'transaction') {
        await this.pollTransaction(
          request.keyringRequest.id,
          request as CustodialSnapRequest<TransactionRequest>,
        );
      }
    }
  }

  async pollTransaction(
    requestId: string,
    request: CustodialSnapRequest<TransactionRequest>,
  ): Promise<void> {
    const { account } = request.keyringRequest;
    const { address } = await this.#keyringFacade.getAccount(account);
    const custodianApi = await this.#keyringFacade.getCustodianApiForAddress(
      address,
    );

    const { custodianTransactionId } = request.transaction;

    const transactionResponse = await custodianApi.getTransaction(
      address,
      custodianTransactionId,
    );

    if (
      transactionResponse?.transactionStatus.finished &&
      !transactionResponse.transactionStatus.success
    ) {
      await this.emitRejectedEvent(requestId);
      await this.removePendingRequest(requestId);
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

      const updatedTransaction = {
        ...request,
        fulfilled: true,
        result: signature,
      };
      Object.assign(request, updatedTransaction);
      await this.emitApprovedEvent(requestId, signature);
      await this.removePendingRequest(requestId);
    }
  }

  async pollSignedMessage(
    requestId: string,
    request: CustodialSnapRequest<SignedMessageRequest>,
  ): Promise<void> {
    const { account } = request.keyringRequest;
    const { address } = await this.#keyringFacade.getAccount(account);
    const custodianApi = await this.#keyringFacade.getCustodianApiForAddress(
      address,
    );

    const signedMessageResponse = await custodianApi.getSignedMessage(
      address,
      request.message.id,
    );

    if (signedMessageResponse?.status?.finished) {
      if (signedMessageResponse.status.success) {
        const updatedSignedMessage = {
          ...request,
          fulfilled: true,
          result: signedMessageResponse.signature,
        };
        Object.assign(request, updatedSignedMessage);
        await this.emitApprovedEvent(
          requestId,
          signedMessageResponse.signature,
        );
      } else {
        await this.emitRejectedEvent(requestId);
      }
      await this.removePendingRequest(requestId);
    }
  }

  async emitApprovedEvent(id: string, result: Json): Promise<void> {
    await emitSnapKeyringEvent(snap, KeyringEvent.RequestApproved, {
      id,
      result,
    });
  }

  async emitRejectedEvent(id: string): Promise<void> {
    await emitSnapKeyringEvent(snap, KeyringEvent.RequestRejected, {
      id,
    });
  }
}
