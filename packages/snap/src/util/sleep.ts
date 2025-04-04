import { Mutex } from 'async-mutex';

/**
 * Sleep state management system for the institutional snap.
 *
 * The sleep state controls the snap's polling behavior to optimize resource usage
 * and user experience. When the snap is "asleep", it will not poll for
 * transaction updates or perform other background tasks.
 *
 * The sleep state is managed atomically using a mutex to prevent race conditions
 * in the following scenarios:
 * - Multiple cronjobs running concurrently (15-second and 1-minute intervals)
 * - User interaction events (like onboarding) occurring while cronjobs are running
 * - State transitions during client lock/unlock events
 *
 * Sleep state transitions:
 * - The snap goes to sleep when:
 * 1. The client is locked
 * 2. The snap has never been activated (no onboarding completed)
 * - The snap wakes up when:
 * 1. The client is unlocked AND the snap is activated
 * 2. During onboarding (to allow initial setup)
 *
 * This implementation ensures that:
 * - We don't unnecessarily poll when the snap isn't being used
 * - We maintain a consistent state during concurrent operations
 * - We properly handle MetaMask client lock/unlock cycles
 * - We preserve user privacy by not accessing encrypted storage while locked
 */

// Create a mutex for sleep state management
const sleepMutex = new Mutex();
let sleep = false; // Protected by sleepMutex

/**
 * Gets the current sleep state in a thread-safe manner.
 *
 * This function uses a mutex to ensure atomic reads of the sleep state,
 * preventing race conditions with concurrent writes.
 *
 * @returns A promise that resolves to the current sleep state.
 */
export const getSleepState = async (): Promise<boolean> => {
  return await sleepMutex.runExclusive(() => sleep);
};

/**
 * Sets the sleep state in a thread-safe manner.
 *
 * This function uses a mutex to ensure atomic writes to the sleep state,
 * preventing race conditions with concurrent reads or other writes.
 * The sleep state affects the snap's polling behavior and resource usage.
 *
 * @param newState - The new sleep state to set. True puts the snap to sleep,
 * false wakes it up and allows polling to resume.
 */
export const setSleepState = async (newState: boolean): Promise<void> => {
  await sleepMutex.runExclusive(() => {
    sleep = newState;
  });
};
