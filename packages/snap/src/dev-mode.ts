import { Mutex } from 'async-mutex';

import { getStateData, setStateData } from './snap-state-manager/snap-util';

/**
 * Dev mode ("enable development custodians") is deliberately kept in the
 * UNENCRYPTED snap store, separately from `SnapState`.
 *
 * Encrypted state can only be read while the MetaMask client is unlocked. Dev
 * mode gates which origins may call the snap (see `./permissions`), so keeping
 * it encrypted meant permissions could not be computed correctly until after an
 * unlock -- and, because it used to be mirrored into a module-level global that
 * nothing hydrated on startup, it silently read as `false` on every fresh snap
 * execution. It is a non-sensitive UI flag, so it lives unencrypted instead.
 *
 * NOTE: this is currently the only consumer of the unencrypted store, and
 * `setStateData` replaces the store wholesale. If anything else starts using it,
 * make these read-modify-write against the whole object.
 */
type DevModeState = {
  devMode?: boolean;
};

/**
 * Legacy shape: dev mode used to live on the encrypted `SnapState`. Only read,
 * never written, and only to migrate the value across once.
 */
type LegacyState = {
  devMode?: boolean;
} | null;

const mutex = new Mutex();

/**
 * Best-effort cache of the last known dev mode value, for synchronous callers
 * that cannot await state (currently only log verbosity in `./logger`).
 *
 * Never gate behaviour on this -- it is `false` until something calls
 * `isDevMode()`, so a stale read means "fewer log lines", never a difference in
 * what the snap permits or does.
 */
let cached = false;

/**
 * Reads dev mode from the unencrypted store, migrating the legacy encrypted
 * value across the first time if necessary.
 *
 * @returns Whether dev mode is enabled.
 */
async function read(): Promise<boolean> {
  const state = await getStateData<DevModeState>(false);

  if (typeof state?.devMode === 'boolean') {
    return state.devMode;
  }

  // No unencrypted value yet, so this snap has not been migrated. The legacy
  // value is in encrypted state, which is only readable while unlocked.
  let legacy: LegacyState = null;
  try {
    legacy = await getStateData<LegacyState>(true);
  } catch {
    // Client is locked. Report the default without persisting it, so the
    // migration is retried on a later (unlocked) call rather than silently
    // discarding an enabled dev mode.
    return false;
  }

  const devMode = legacy?.devMode ?? false;
  await setStateData<DevModeState>({ data: { devMode }, encrypted: false });
  return devMode;
}

/**
 * Whether dev mode is enabled. Reads persisted state, so it is correct on the
 * very first call after a snap restart and while the client is locked.
 *
 * @returns Whether dev mode is enabled.
 */
export async function isDevMode(): Promise<boolean> {
  const devMode = await mutex.runExclusive(read);
  cached = devMode;
  return devMode;
}

/**
 * Enable or disable dev mode.
 *
 * @param devMode - The new dev mode value.
 */
export async function setDevMode(devMode: boolean): Promise<void> {
  await mutex.runExclusive(async () => {
    await setStateData<DevModeState>({ data: { devMode }, encrypted: false });
  });
  cached = devMode;
}

/**
 * Synchronous, best-effort dev mode read for callers that cannot await.
 *
 * Only use this for log verbosity. See `cached` above.
 *
 * @returns The last known dev mode value, defaulting to `false`.
 */
export function isDevModeSync(): boolean {
  return cached;
}
