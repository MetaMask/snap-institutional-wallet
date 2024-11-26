import { KeyringEvent } from '@metamask/keyring-api';

import type { ITransactionDetails } from './lib/types';
import type { KeyringState } from './lib/types/CustodialKeyring';
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

  async processPendingRequest(
    id: string,
    handlers: {
      processTransaction: (
        tx: ITransactionDetails,
      ) => Promise<{ v: string; r: string; s: string }>;
      processSignature: (id: string) => Promise<any>;
      emitEvent: (
        event: KeyringEvent,
        data: { id: string; result: any },
      ) => Promise<void>;
    },
  ): Promise<void> {
    if (this.#state.pendingTransactions[id]) {
      const signature = await handlers.processTransaction(
        this.#state.pendingTransactions[id],
      );

      logger.info(
        `Now emitting request approved event for transaction ${id}`,
        signature,
      );
      await handlers.emitEvent(KeyringEvent.RequestApproved, {
        id,
        result: signature,
      });
    }

    // Handle signature requests
    const signature = await handlers.processSignature(id);
    await handlers.emitEvent(KeyringEvent.RequestApproved, {
      id,
      result: signature,
    });
    return signature;
  }
}
