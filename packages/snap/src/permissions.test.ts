import { KeyringRpcMethod } from '@metamask/keyring-api';

import { isDevMode } from './dev-mode';
import {
  InternalMethod,
  buildOriginPermissions,
  getOriginPermissions,
  hasPermission,
} from './permissions';

jest.mock('./dev-mode', () => ({
  isDevMode: jest.fn(),
}));

jest.mock('./lib/custodian-types/custodianMetadata', () => ({
  custodianMetadata: [
    {
      production: true,
      allowedOnboardingDomains: ['example.com', 'test.com'],
    },
    {
      production: false,
      allowedOnboardingDomains: ['dev-only.com'],
    },
  ],
}));

const mockIsDevMode = isDevMode as jest.MockedFunction<typeof isDevMode>;

describe('Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDevMode.mockResolvedValue(false);
  });

  describe('buildOriginPermissions', () => {
    it('should set up MetaMask permissions correctly', () => {
      const metamaskPermissions = buildOriginPermissions(false).get('metamask');

      expect(metamaskPermissions).toBeDefined();
      expect(metamaskPermissions?.has(KeyringRpcMethod.ListAccounts)).toBe(
        true,
      );
      expect(metamaskPermissions?.has(KeyringRpcMethod.GetAccount)).toBe(true);
      expect(
        metamaskPermissions?.has(KeyringRpcMethod.FilterAccountChains),
      ).toBe(true);
      expect(metamaskPermissions?.has(KeyringRpcMethod.DeleteAccount)).toBe(
        true,
      );
      expect(metamaskPermissions?.has(KeyringRpcMethod.ListRequests)).toBe(
        true,
      );
      expect(metamaskPermissions?.has(KeyringRpcMethod.GetRequest)).toBe(true);
      // The client calls this after confirming an account import; if it isn't
      // allowed through, the snap crashes.
      expect(
        metamaskPermissions?.has(KeyringRpcMethod.SetSelectedAccounts),
      ).toBe(true);
      expect(metamaskPermissions?.has(KeyringRpcMethod.SubmitRequest)).toBe(
        true,
      );
    });

    it('should set up custodian onboarding permissions correctly', () => {
      const originPermissions = buildOriginPermissions(false);

      expect(
        originPermissions
          .get('https://example.com')
          ?.has(InternalMethod.Onboard),
      ).toBe(true);
      expect(
        originPermissions.get('https://test.com')?.has(InternalMethod.Onboard),
      ).toBe(true);
    });

    it('should exclude non-production custodians when not in dev mode', () => {
      expect(
        buildOriginPermissions(false).get('https://dev-only.com'),
      ).toBeUndefined();
      expect(
        buildOriginPermissions(true).get('https://dev-only.com'),
      ).toBeDefined();
    });

    it('should gate localhost permissions on dev mode', () => {
      expect(
        buildOriginPermissions(false).get('http://localhost:8000'),
      ).toBeUndefined();

      const localhostPermissions = buildOriginPermissions(true).get(
        'http://localhost:8000',
      );
      expect(localhostPermissions).toBeDefined();
      expect(localhostPermissions?.has(KeyringRpcMethod.ListAccounts)).toBe(
        true,
      );
      expect(localhostPermissions?.has(KeyringRpcMethod.CreateAccount)).toBe(
        true,
      );
      expect(localhostPermissions?.has(InternalMethod.Onboard)).toBe(true);
      expect(localhostPermissions?.has(InternalMethod.ClearAllRequests)).toBe(
        true,
      );
    });
  });

  describe('hasPermission', () => {
    it('should read dev mode from state on every call', async () => {
      // The whole point of making this a function of dev mode: no init step to
      // forget, so flipping the setting takes effect on the next call.
      mockIsDevMode.mockResolvedValue(false);
      expect(
        await hasPermission('http://localhost:8000', InternalMethod.Onboard),
      ).toBe(false);

      mockIsDevMode.mockResolvedValue(true);
      expect(
        await hasPermission('http://localhost:8000', InternalMethod.Onboard),
      ).toBe(true);
    });

    it('should deny unknown origins', async () => {
      expect(
        await hasPermission('https://evil.example', InternalMethod.Onboard),
      ).toBe(false);
    });

    it('should deny methods the origin does not have', async () => {
      expect(
        await hasPermission('metamask', InternalMethod.ClearAllRequests),
      ).toBe(false);
    });
  });

  describe('getOriginPermissions', () => {
    it('should return the map for the current dev mode setting', async () => {
      mockIsDevMode.mockResolvedValue(true);
      expect(
        (await getOriginPermissions()).get('http://localhost:8000'),
      ).toBeDefined();

      mockIsDevMode.mockResolvedValue(false);
      expect(
        (await getOriginPermissions()).get('http://localhost:8000'),
      ).toBeUndefined();
    });
  });
});
