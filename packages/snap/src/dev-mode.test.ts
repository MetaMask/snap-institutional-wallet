import { isDevMode, isDevModeSync, setDevMode } from './dev-mode';
import * as snapUtil from './snap-state-manager/snap-util';

describe('dev mode', () => {
  let getStateData: jest.SpyInstance;
  let setStateData: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    getStateData = jest.spyOn(snapUtil, 'getStateData');
    setStateData = jest.spyOn(snapUtil, 'setStateData').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isDevMode', () => {
    it('reads the value from the unencrypted store', async () => {
      getStateData.mockResolvedValue({ devMode: true });

      expect(await isDevMode()).toBe(true);
      expect(getStateData).toHaveBeenCalledWith(false);
    });

    it('returns false when the unencrypted store says so', async () => {
      getStateData.mockResolvedValue({ devMode: false });

      expect(await isDevMode()).toBe(false);
    });

    // The reason for moving off encrypted state: permissions depend on dev mode,
    // and encrypted state is unreadable until the client is unlocked.
    it('does not need the client to be unlocked', async () => {
      getStateData.mockImplementation(async (encrypted: boolean) => {
        if (encrypted) {
          throw new Error(
            'This method is not available while the client is locked',
          );
        }
        return { devMode: true };
      });

      expect(await isDevMode()).toBe(true);
    });
  });

  describe('migration from encrypted state', () => {
    it('migrates the legacy value and persists it unencrypted', async () => {
      getStateData.mockImplementation(async (encrypted: boolean) =>
        encrypted ? { devMode: true } : {},
      );

      expect(await isDevMode()).toBe(true);
      expect(setStateData).toHaveBeenCalledWith({
        data: { devMode: true },
        encrypted: false,
      });
    });

    it('migrates a legacy false and stops re-reading encrypted state', async () => {
      getStateData.mockImplementation(async (encrypted: boolean) =>
        encrypted ? { devMode: false } : {},
      );

      expect(await isDevMode()).toBe(false);
      expect(setStateData).toHaveBeenCalledWith({
        data: { devMode: false },
        encrypted: false,
      });
    });

    it('handles a null legacy state', async () => {
      getStateData.mockImplementation(async (encrypted: boolean) =>
        encrypted ? null : {},
      );

      expect(await isDevMode()).toBe(false);
    });

    // Persisting `false` here would permanently discard an enabled dev mode.
    it('defers migration rather than persisting a default when locked', async () => {
      getStateData.mockImplementation(async (encrypted: boolean) => {
        if (encrypted) {
          throw new Error('locked');
        }
        return {};
      });

      expect(await isDevMode()).toBe(false);
      expect(setStateData).not.toHaveBeenCalled();
    });
  });

  describe('setDevMode', () => {
    it('persists to the unencrypted store', async () => {
      await setDevMode(true);

      expect(setStateData).toHaveBeenCalledWith({
        data: { devMode: true },
        encrypted: false,
      });
    });

    it('is visible to the next read', async () => {
      getStateData.mockResolvedValue({ devMode: true });

      await setDevMode(true);

      expect(await isDevMode()).toBe(true);
    });
  });

  describe('isDevModeSync', () => {
    it('reflects the last known value', async () => {
      getStateData.mockResolvedValue({ devMode: true });

      await isDevMode();

      expect(isDevModeSync()).toBe(true);
    });

    it('follows setDevMode without needing a read', async () => {
      await setDevMode(true);
      expect(isDevModeSync()).toBe(true);

      await setDevMode(false);
      expect(isDevModeSync()).toBe(false);
    });
  });
});
