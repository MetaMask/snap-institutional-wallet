import type {
  CustodialSnapRequest,
  OnBoardingRpcRequest,
  SignedMessageRequest,
  TransactionRequest,
} from './lib/structs/CustodialKeyringStructs';
import type { EncryptedState, Wallet } from './lib/types/CustodialKeyring';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import logger from './logger';
import { SnapStateManager } from './snap-state-manager/SnapStateManager';

/**
 * Compacts an error to a specific error instance.
 *
 * @param error - The error instance to be compacted.
 * @param ErrCtor - The error constructor for the desired error instance.
 * @returns The compacted error instance.
 */
export function compactError<ErrorInstance extends Error>(
  error: ErrorInstance,
  ErrCtor: new (message?: string) => ErrorInstance,
): ErrorInstance {
  if (error instanceof ErrCtor) {
    return error;
  }
  return new ErrCtor(error.message);
}

export class EncryptedStateManager extends SnapStateManager<EncryptedState> {
  protected override async get(): Promise<EncryptedState> {
    return super.get().then((state: EncryptedState) => {
      if (!state) {
        // eslint-disable-next-line no-param-reassign
        state = {
          wallets: {},
          walletIds: [],
          requests: {},
        };
      }

      if (!state.wallets) {
        state.wallets = {};
      }

      if (!state.walletIds) {
        state.walletIds = [];
      }

      if (!state.requests) {
        state.requests = {};
      }

      return state;
    });
  }

  async listAccounts(): Promise<CustodialKeyringAccount[]> {
    const state = await this.get();
    return Object.values(state.wallets).map((wallet) => wallet.account);
  }

  async listWallets(): Promise<Wallet[]> {
    const state = await this.get();
    return Object.values(state.wallets);
  }

  async addWallet(wallet: Wallet): Promise<void> {
    try {
      await this.update(async (state: EncryptedState) => {
        const { id, address } = wallet.account;
        if (
          this.isAccountExist(state, id) ||
          (await this.getWalletByAddress(address))
        ) {
          throw new Error(`Account address ${address} already exists`);
        }

        // Since this occurs in a transaction, we can disable the atomic update check
        // eslint-disable-next-line require-atomic-updates
        state.wallets[id] = wallet;
        state.walletIds.push(id);
      });
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async updateAccount(account: CustodialKeyringAccount): Promise<void> {
    try {
      await this.update(async (state: EncryptedState) => {
        if (!this.isAccountExist(state, account.id)) {
          throw new Error(`Account id ${account.id} does not exist`);
        }
        const wallet = state.wallets[account.id];

        if (!wallet) {
          throw new Error(`Wallet for account ${account.id} does not exist`);
        }
        const accountInState = wallet.account;

        if (
          accountInState.address.toLowerCase() !==
            account.address.toLowerCase() ||
          accountInState.type !== account.type
        ) {
          throw new Error(`Account address or type is immutable`);
        }

        wallet.account = account;
      });
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async updateWalletDetails(
    accountId: string,
    details: OnBoardingRpcRequest,
  ): Promise<void> {
    try {
      await this.update(async (state: EncryptedState) => {
        const wallet = state.wallets[accountId];
        if (!wallet) {
          throw new Error(`Wallet for account ${accountId} does not exist`);
        }
        wallet.details = details;
      });
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async removeAccounts(ids: string[]): Promise<void> {
    try {
      await this.update(async (state: EncryptedState) => {
        const removeIds = new Set<string>();

        for (const id of ids) {
          if (!this.isAccountExist(state, id)) {
            throw new Error(`Account id ${id} does not exist`);
          }
          removeIds.add(id);
        }

        removeIds.forEach((id) => delete state.wallets[id]);
        state.walletIds = state.walletIds.filter((id) => !removeIds.has(id));
      });
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async getAccount(id: string): Promise<CustodialKeyringAccount | null> {
    try {
      const state = await this.get();
      return state.wallets[id]?.account ?? null;
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async getWallet(id: string): Promise<Wallet | null> {
    try {
      const state = await this.get();
      return state.wallets[id] ?? null;
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async getWalletByAddress(address: string): Promise<Wallet | null> {
    const state = await this.get();
    return (
      Object.values(state.wallets).find(
        (wallet) => wallet.account.address.toString() === address.toLowerCase(),
      ) ?? null
    );
  }

  async listRequests(): Promise<
    CustodialSnapRequest<SignedMessageRequest | TransactionRequest>[]
  > {
    const state = await this.get();
    return Object.values(state.requests);
  }

  async getRequest(
    id: string,
  ): Promise<CustodialSnapRequest<
    SignedMessageRequest | TransactionRequest
  > | null> {
    try {
      const state = await this.get();
      return state.requests[id] ?? null;
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async upsertRequest(
    request: CustodialSnapRequest<SignedMessageRequest | TransactionRequest>,
  ): Promise<void> {
    try {
      await this.update(async (state: EncryptedState) => {
        state.requests[request.keyringRequest.id] = {
          ...state.requests[request.keyringRequest.id],
          ...request,
        };
      });
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async removeRequest(id: string): Promise<void> {
    try {
      await this.update(async (state: EncryptedState) => {
        if (state.requests[id]) {
          delete state.requests[id];
        } else {
          logger.debug('request not found', id);
        }
      });
    } catch (error) {
      throw compactError(error as Error, Error);
    }
  }

  async clearAllRequests(): Promise<void> {
    await this.update(async (state: EncryptedState) => {
      state.requests = {};
    });
  }

  protected isAccountExist(state: EncryptedState, id: string): boolean {
    return Object.prototype.hasOwnProperty.call(state.wallets, id);
  }

  protected isRequestExist(state: EncryptedState, id: string): boolean {
    return Object.prototype.hasOwnProperty.call(state.requests, id);
  }
}
