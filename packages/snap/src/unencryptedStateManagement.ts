import type { State } from './lib/types/CustodialKeyring';
import { SnapStateManager } from './snap-state-manager/SnapStateManager';

// Most of the state is stored in the encrypted state manager
// This state manager acts as a place to store non-sensitive things
// That can be accessed while the snap is locked
export class UnencryptedStateManager extends SnapStateManager<State> {
  constructor() {
    super({
      encrypted: false,
    });
  }

  protected override async get(): Promise<State> {
    return super.get().then((state: State) => {
      if (!state) {
        // eslint-disable-next-line no-param-reassign
        state = {
          numberOfAccounts: 0,
        };
      }

      return state;
    });
  }

  async getState(): Promise<State> {
    return this.get();
  }

  async getNumberOfAccounts(): Promise<number> {
    return this.get().then((state: State) => state.numberOfAccounts);
  }

  async setNumberOfAccounts(numberOfAccounts: number): Promise<void> {
    await this.update(async (state: State) => {
      state.numberOfAccounts = numberOfAccounts;
    });
  }
}
