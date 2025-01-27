import type { Json } from '@metamask/snaps-sdk';

import type { KeyringState } from './lib/types/CustodialKeyring';
import logger from './logger';

/**
 * Default keyring state.
 */
const defaultState: KeyringState = {
  wallets: {},
  requests: {},
};

/**
 * Retrieves the current state of the keyring.
 *
 * @returns The current state of the keyring.
 */
export async function getState(): Promise<KeyringState> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as any;

  logger.debug('Retrieved state:', JSON.stringify(state)); // @audit - infoleak to console log?

  return {
    ...defaultState,
    ...state,
  };
}

/**
 * Clears the keyring state.
 */
export async function clearState(): Promise<void> {
  await saveState(defaultState);
}

/**
 * Persists the given snap state.
 *
 * @param state - New snap state.
 */
export async function saveState(state: KeyringState) {
  logger.debug('Saving state:', JSON.stringify(state)); // @audit infoleak keyring state

  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: state as unknown as Record<string, Json>,
    },
  });
}
