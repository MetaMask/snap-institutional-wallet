import { KeyringEvent } from '@metamask/keyring-api';

import type { ITransactionDetails } from './lib/types';
import type { KeyringState } from './lib/types/CustodialKeyring';
import type { EthSignTransactionRequest } from './lib/types/EthSignTransactionRequest';
import logger from './logger';
import { saveState } from './stateManagement';

export class RequestManager {
  #state: KeyringState;

  constructor(state: KeyringState) {
    this.#state = state;
  }

  async removePendingRequest(id: string): Promise<void> {
    delete this.#state.pendingRequests[id];
    delete this.#state.pendingTransactions[id];
    delete this.#state.pendingSignMessages[id];
    await saveState(this.#state);
  }

  async getChainIdFromPendingRequest(id: string): Promise<string> {
    if (!this.#state.pendingRequests[id]) {
      throw new Error(`Request ${id} not found`);
    }

    const requestParams = this.#state.pendingRequests[id]!.request.params;

    if (!Array.isArray(requestParams) || requestParams.length === 0) {
      throw new Error(`Request ${id} has invalid params`);
    }

    const transactionRequest = requestParams[0] as EthSignTransactionRequest;
    if (!transactionRequest.chainId) {
      throw new Error(`Request ${id} has no chainId`);
    }

    return transactionRequest.chainId;
  }

  async processPendingRequest(
    id: string,
    handlers: {
      processTransaction: (
        tx: ITransactionDetails,
        chainId: string,
      ) => Promise<{ v: string; r: string; s: string }>;
      processSignature: (id: string) => Promise<any>;
      emitEvent: (
        event: KeyringEvent,
        data: { id: string; result: any },
      ) => Promise<void>;
    },
  ): Promise<void> {
    if (this.#state.pendingTransactions[id]) {
      const tx = this.#state.pendingTransactions[id] as ITransactionDetails;

      const signature = await handlers.processTransaction(
        tx,
        await this.getChainIdFromPendingRequest(id),
      );

      logger.info(
        `Now emitting request approved event for transaction ${id}`,
        signature,
      );
      await handlers.emitEvent(KeyringEvent.RequestApproved, {
        id,
        result: signature,
      });
      return; // Exit after processing transaction
    }

    if (this.#state.pendingSignMessages[id]) {
      const signature = await handlers.processSignature(id);
      await handlers.emitEvent(KeyringEvent.RequestApproved, {
        id,
        result: signature,
      });
    }
  }
}
