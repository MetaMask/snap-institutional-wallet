import { KeyringRpcMethod } from '@metamask/keyring-api';

import { InternalMethod } from './permissions';

describe('Permissions', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('originPermissions', () => {
    beforeEach(() => {
      jest.mock('./config', () => ({
        dev: false,
      }));

      jest.mock('./lib/custodian-types/custodianMetadata', () => ({
        custodianMetadata: [
          {
            allowedOnboardingDomains: ['example.com', 'test.com'],
          },
        ],
      }));
    });

    it('should set up MetaMask permissions correctly', async () => {
      const { originPermissions } = await import('./permissions');
      const metamaskPermissions = originPermissions.get('metamask');
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
      expect(metamaskPermissions?.has(KeyringRpcMethod.SubmitRequest)).toBe(
        true,
      );
    });

    it('should set up custodian onboarding permissions correctly', async () => {
      const { originPermissions } = await import('./permissions');
      const examplePermissions = originPermissions.get('https://example.com');
      const testPermissions = originPermissions.get('https://test.com');

      expect(examplePermissions?.has(InternalMethod.Onboard)).toBe(true);
      expect(testPermissions?.has(InternalMethod.Onboard)).toBe(true);
    });

    it('should not include localhost permissions when not in dev mode', async () => {
      const { originPermissions } = await import('./permissions');
      const localhostPermissions = originPermissions.get(
        'http://localhost:8000',
      );
      expect(localhostPermissions).toBeUndefined();
    });

    describe('when in dev mode', () => {
      beforeEach(() => {
        jest.resetModules();
        jest.mock('./config', () => ({
          dev: true,
        }));
      });

      it('should include localhost permissions in dev mode', async () => {
        const { originPermissions: devOriginPermissions } = await import(
          './permissions'
        );

        const localhostPermissions = devOriginPermissions.get(
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
  });
});
