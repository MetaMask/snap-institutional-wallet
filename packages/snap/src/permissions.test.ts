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
            production: true,
            allowedOnboardingDomains: ['example.com', 'test.com'],
          },
        ],
      }));
    });

    it('should set up MetaMask permissions correctly', async () => {
      const { getOriginPermissions } = await import('./permissions');
      const originPermissions = getOriginPermissions();
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
      const { getOriginPermissions } = await import('./permissions');
      const originPermissions = getOriginPermissions();
      const examplePermissions = originPermissions.get('https://example.com');
      const testPermissions = originPermissions.get('https://test.com');

      expect(examplePermissions?.has(InternalMethod.Onboard)).toBe(true);
      expect(testPermissions?.has(InternalMethod.Onboard)).toBe(true);
    });

    it('should not include localhost permissions when not in dev mode', async () => {
      const { getOriginPermissions } = await import('./permissions');
      const originPermissions = getOriginPermissions();
      const localhostPermissions = originPermissions.get(
        'http://localhost:8000',
      );
      expect(localhostPermissions).toBeUndefined();
    });

    describe('when in dev mode', () => {
      const mockConfig = {
        dev: true,
      };

      beforeEach(() => {
        jest.resetModules();
        jest.mock('./config', () => mockConfig);
      });

      it('should include localhost permissions in dev mode', async () => {
        const { getOriginPermissions } = await import('./permissions');
        const originPermissions = getOriginPermissions();

        const localhostPermissions = originPermissions.get(
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

      it('should not include localhost permissions when not in dev mode, but when it is changes and we call initPermissions, it should include localhost permissions', async () => {
        const { hasPermission, initPermissions } = await import(
          './permissions'
        );
        mockConfig.dev = false;

        initPermissions();

        expect(
          hasPermission('http://localhost:8000', InternalMethod.Onboard),
        ).toBe(false);

        mockConfig.dev = true;
        initPermissions();

        expect(
          hasPermission('http://localhost:8000', InternalMethod.Onboard),
        ).toBe(true);
      });
    });
  });
});
