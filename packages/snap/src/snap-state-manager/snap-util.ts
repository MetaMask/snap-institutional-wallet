import type { Json } from '@metamask/snaps-sdk';

/**
 * Retrieves the current state data.
 *
 * @param encrypted - A boolean indicating whether the state data is encrypted.
 * @returns A Promise that resolves to the current state data.
 */
export async function getStateData<State>(encrypted: boolean): Promise<State> {
  return (await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'get',
      encrypted,
    },
  })) as unknown as State;
}

/**
 * Sets the current state data to the specified data.
 *
 * @param data - An object containing the new state data and encryption flag.
 * @param data.data - The new state data to set.
 * @param data.encrypted - A boolean indicating whether the state data is encrypted.
 */
export async function setStateData<State>({
  data,
  encrypted,
}: {
  data: State;
  encrypted: boolean;
}): Promise<void> {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: data as unknown as Record<string, Json>,
      encrypted,
    },
  });
}
