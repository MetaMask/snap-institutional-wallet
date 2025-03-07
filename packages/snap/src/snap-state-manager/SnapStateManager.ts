// Borrowed wholesale from the bitcoin snap

import { type MutexInterface } from 'async-mutex';
import { v4 as uuidv4 } from 'uuid';

import { acquireLock } from './lock';
import logger from '../logger';
import { getStateData, setStateData } from './snap-util';

export type Transaction<State> = {
  id?: string | undefined;
  orgState?: State | undefined;
  current?: State | undefined;
  isRollingBack: boolean;
  hasCommitted: boolean;
};

export abstract class SnapStateManager<State> {
  protected readonly mtx: MutexInterface;

  #transaction: Transaction<State>;

  #encryptedMode: boolean;

  constructor({
    createLock = false,
    encrypted = true,
  }: { createLock?: boolean; encrypted?: boolean } = {}) {
    this.mtx = acquireLock(createLock);
    this.#transaction = {
      id: undefined,
      orgState: undefined,
      current: undefined,
      isRollingBack: false,
      hasCommitted: false,
    };
    this.#encryptedMode = encrypted;
  }

  protected async get(): Promise<State> {
    return getStateData<State>(this.#encryptedMode);
  }

  protected async set(state: State): Promise<void> {
    return setStateData<State>({ data: state, encrypted: this.#encryptedMode });
  }

  protected async update(
    callback: (state: State) => Promise<void>,
  ): Promise<void> {
    if (this.mtx.isLocked()) {
      if (this.#transaction.current) {
        logger.info(
          `SnapStateManager.update [${
            this.#transactionId
          }]: transaction is processing, use existing state`,
        );
        await callback(this.#transaction.current);
        return;
      }
      logger.info(
        `SnapStateManager.update: transaction is not exist, create lock after prev lock is released`,
      );
    }
    await this.mtx.runExclusive(async () => {
      const state = await this.get();
      await callback(state);
      await this.set(state);
    });
  }

  /**
   * This method executes the callback code in a transaction-like format. It creates a lock to ensure the state is not intercepted during the transaction and initializes a transaction with the current state, original state, and transaction ID. If there is an error during the transaction, the state is rolled back to the original state. However, if the lock has no time limit, it might cause a deadlock if the transaction is not completed.
   *
   * @param callback - A Promise function that takes the state as an argument.
   */
  public async withTransaction(
    callback: (state: State) => Promise<void>,
  ): Promise<void> {
    await this.mtx.runExclusive(async () => {
      await this.#beginTransaction();

      if (
        !this.#transaction.current ||
        !this.#transaction.orgState ||
        !this.#transaction.id
      ) {
        throw new Error('Failed to begin transaction');
      }

      logger.info(
        `SnapStateManager.withTransaction [${
          this.#transactionId
        }]: begin transaction`,
      );

      try {
        await callback(this.#transaction.current);
        await this.set(this.#transaction.current);
      } catch (error) {
        logger.info(
          `SnapStateManager.withTransaction [${
            this.#transactionId
          }]: error : ${JSON.stringify(
            error instanceof Error ? error.message : String(error),
          )}`,
        );

        await this.#rollback();

        throw error;
      } finally {
        this.#cleanUpTransaction();
      }
    });
  }

  async commit() {
    if (!this.#transaction.current || !this.#transaction.orgState) {
      throw new Error('Failed to commit transaction');
    }
    this.#transaction.hasCommitted = true;
    await this.set(this.#transaction.current);
  }

  async #beginTransaction(): Promise<void> {
    this.#transaction = {
      id: uuidv4(),
      orgState: await this.get(),
      current: await this.get(), // make sure the current is not referenced to orgState
      isRollingBack: false,
      hasCommitted: false,
    };
  }

  async #rollback(): Promise<void> {
    try {
      // we only need to rollback if the transaction is committed
      if (
        this.#transaction.hasCommitted &&
        !this.#transaction.isRollingBack &&
        this.#transaction.orgState
      ) {
        logger.info(
          `SnapStateManager.rollback [${
            this.#transactionId
          }]: attempt to rollback state`,
        );
        this.#transaction.isRollingBack = true;
        await this.set(this.#transaction.orgState);
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      logger.info(
        `SnapStateManager.rollback [${
          this.#transactionId
        }]: error : ${JSON.stringify(error)}`,
      );
      throw new Error('Failed to rollback state');
    }
  }

  #cleanUpTransaction(): void {
    this.#transaction.orgState = undefined;
    this.#transaction.current = undefined;
    this.#transaction.id = undefined;
    this.#transaction.isRollingBack = false;
    this.#transaction.hasCommitted = false;
  }

  get #transactionId(): string {
    return this.#transaction.id ?? '';
  }
}
