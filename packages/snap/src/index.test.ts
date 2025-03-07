import type { JsonRpcRequest } from '@metamask/keyring-api';
import { handleKeyringRequest } from '@metamask/keyring-api';

import { onRpcRequest, onKeyringRequest, onCronjob } from '.';
import { getKeyring, getRequestManager } from './context';
import { renderErrorMessage } from './features/error-message/render';
import { renderOnboarding } from './features/onboarding/render';
import { CustodianType } from './lib/types/CustodianType';
import { InternalMethod, originPermissions } from './permissions';
import { getClientStatus } from './snap-state-manager/snap-util';

// Mock the context module
jest.mock('./context', () => ({
  getKeyring: jest.fn(),
  getRequestManager: jest.fn(),
}));

// Mock the keyring-api module
jest.mock('@metamask/keyring-api', () => ({
  ...jest.requireActual('@metamask/keyring-api'),
  handleKeyringRequest: jest.fn(),
}));

// Mock the ECA3 client
jest.mock('./lib/custodian-types/eca3/ECA3CustodianApi', () => {
  return {
    ECA3CustodianApi: jest.fn().mockImplementation(() => ({
      getEthereumAccounts: jest.fn().mockResolvedValue([]),
    })),
  };
});

// Mock the onboarding renderer
jest.mock('./features/onboarding/render', () => ({
  renderOnboarding: jest.fn().mockImplementation(async () => [
    {
      address: '0x123',
      name: 'Test Account',
    },
  ]),
}));

const mockRenderOnboarding = renderOnboarding as jest.MockedFunction<
  typeof renderOnboarding
>;

// Add this mock at the top of the test file with other mocks
jest.mock('./snap-state-manager/snap-util');

// Add type assertion for the mock
const mockGetClientStatus = getClientStatus as jest.MockedFunction<
  typeof getClientStatus
>;

jest.mock('./features/error-message/render', () => ({
  renderErrorMessage: jest.fn(),
}));

const mockRenderErrorMessage = renderErrorMessage as jest.MockedFunction<
  typeof renderErrorMessage
>;

describe('index', () => {
  const mockKeyring = {
    listAccounts: jest.fn().mockResolvedValue([]),
    handleOnboarding: jest.fn(),
    createAccount: jest.fn(),
  };

  const mockRequestManager = {
    listRequests: jest.fn().mockResolvedValue([]),
    upsertRequest: jest.fn(),
    clearAllRequests: jest.fn(),
    poll: jest.fn(),
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    (getKeyring as jest.Mock).mockResolvedValue(mockKeyring);
    (getRequestManager as jest.Mock).mockResolvedValue(mockRequestManager);

    // Set up permissions for example.com
    originPermissions.set(
      'https://example.com',
      new Set([InternalMethod.Onboard, 'keyring_listAccounts']),
    );

    // Reset the mock implementation for each test
    mockRenderOnboarding.mockImplementation(async () => [
      {
        address: '0x123',
        name: 'Test Account',
      },
    ]);

    // Set default mock return value
    mockGetClientStatus.mockResolvedValue({ locked: false });
  });

  describe('onRpcRequest', () => {
    it('should throw UnauthorizedError for unauthorized origin', async () => {
      await expect(
        onRpcRequest({
          origin: 'unauthorized-origin',
          request: {
            method: InternalMethod.Onboard,
            params: {},
            id: 1,
            jsonrpc: '2.0',
          },
        }),
      ).rejects.toThrow(
        "Origin 'unauthorized-origin' is not allowed to call 'authentication.onboard'",
      );
    });

    it('should throw UnauthorizedError for unsupported method', async () => {
      await expect(
        onRpcRequest({
          origin: 'https://example.com',
          request: {
            method: 'unsupported_method',
            params: {},
            id: 1,
            jsonrpc: '2.0',
          },
        }),
      ).rejects.toThrow(
        "Origin 'https://example.com' is not allowed to call 'unsupported_method'",
      );
    });

    describe('onboarding', () => {
      it('should handle onboarding successfully', async () => {
        const mockRequest = {
          custodianType: CustodianType.ECA3,
          token: 'mock-token',
          refreshTokenUrl: 'https://example.com/refresh',
          custodianApiUrl: 'https://example.com/api',
          custodianEnvironment: 'test',
          custodianDisplayName: 'Test Custodian',
        };

        await onRpcRequest({
          origin: 'https://example.com',
          request: {
            method: InternalMethod.Onboard,
            params: mockRequest,
            id: 1,
            jsonrpc: '2.0',
          },
        });

        expect(mockKeyring.createAccount).toHaveBeenCalledWith({
          address: '0x123',
          name: 'Test Account',
          details: mockRequest,
          origin: 'https://example.com',
        });
        expect(mockRenderOnboarding).toHaveBeenCalledWith(
          expect.objectContaining({
            accounts: [],
          }),
        );
      });

      it('should throw error for unsupported custodian type', async () => {
        const mockRequest = {
          custodianType: 'UNSUPPORTED' as CustodianType,
          token: 'mock-token',
          refreshTokenUrl: 'https://example.com/refresh',
          custodianApiUrl: 'https://example.com/api',
          custodianEnvironment: 'test',
          custodianDisplayName: 'Test Custodian',
        };

        await expect(
          onRpcRequest({
            origin: 'https://example.com',
            request: {
              method: InternalMethod.Onboard,
              params: mockRequest,
              id: 1,
              jsonrpc: '2.0',
            },
          }),
        ).rejects.toThrow(
          'Expected one of `"ECA3","ECA1","BitGo","Cactus"`, but received: "UNSUPPORTED"',
        );
      });

      it('should handle failed account creation and show error message', async () => {
        const mockRequest = {
          custodianType: CustodianType.ECA3,
          token: 'mock-token',
          refreshTokenUrl: 'https://example.com/refresh',
          custodianApiUrl: 'https://example.com/api',
          custodianEnvironment: 'test',
          custodianDisplayName: 'Test Custodian',
        };

        // Mock multiple accounts being selected
        mockRenderOnboarding.mockImplementation(async () => [
          { address: '0x123', name: 'Account 1' },
          { address: '0x456', name: 'Account 2' },
        ]);

        // Mock first account creation succeeding and second failing
        mockKeyring.createAccount
          .mockImplementationOnce(async (account) => ({ ...account }))
          .mockImplementationOnce(async () => {
            throw new Error('Failed to create account');
          });

        const result = await onRpcRequest({
          origin: 'https://example.com',
          request: {
            method: InternalMethod.Onboard,
            params: mockRequest,
            id: 1,
            jsonrpc: '2.0',
          },
        });

        // Verify error message was shown
        expect(mockRenderErrorMessage).toHaveBeenCalledWith(
          'Failed to add account 0x456: Failed to create account',
        );

        // Verify only successful account is returned
        expect(result).toStrictEqual([
          expect.objectContaining({
            address: '0x123',
            name: 'Account 1',
          }),
        ]);
      });

      it('should return empty array when all account creations fail', async () => {
        const mockRequest = {
          custodianType: CustodianType.ECA3,
          token: 'mock-token',
          refreshTokenUrl: 'https://example.com/refresh',
          custodianApiUrl: 'https://example.com/api',
          custodianEnvironment: 'test',
          custodianDisplayName: 'Test Custodian',
        };

        // Mock account creation always failing
        mockKeyring.createAccount.mockRejectedValue(
          new Error('Creation failed'),
        );

        const result = await onRpcRequest({
          origin: 'https://example.com',
          request: {
            method: InternalMethod.Onboard,
            params: mockRequest,
            id: 1,
            jsonrpc: '2.0',
          },
        });

        // Verify error message was shown
        expect(mockRenderErrorMessage).toHaveBeenCalledWith(
          'Failed to add account 0x123: Creation failed',
        );

        // Verify empty array is returned when all accounts fail
        expect(result).toStrictEqual([]);
      });

      it('should handle successful account creation without error message', async () => {
        const mockRequest = {
          custodianType: CustodianType.ECA3,
          token: 'mock-token',
          refreshTokenUrl: 'https://example.com/refresh',
          custodianApiUrl: 'https://example.com/api',
          custodianEnvironment: 'test',
          custodianDisplayName: 'Test Custodian',
        };

        // Mock successful account creation
        mockKeyring.createAccount.mockImplementation(async (account) => ({
          ...account,
        }));

        const result = await onRpcRequest({
          origin: 'https://example.com',
          request: {
            method: InternalMethod.Onboard,
            params: mockRequest,
            id: 1,
            jsonrpc: '2.0',
          },
        });

        // Verify no error message was shown
        expect(mockRenderErrorMessage).not.toHaveBeenCalled();

        // Verify successful account is returned
        expect(result).toStrictEqual([
          expect.objectContaining({
            address: '0x123',
            name: 'Test Account',
          }),
        ]);
      });
    });

    it('should filter out existing accounts', async () => {
      const existingAccount = {
        address: '0x123',
        name: 'Existing Account',
      };

      mockKeyring.listAccounts.mockResolvedValueOnce([existingAccount]);
      mockKeyring.createAccount.mockResolvedValueOnce({} as any);

      await onRpcRequest({
        origin: 'https://example.com',
        request: {
          method: InternalMethod.Onboard,
          params: {
            custodianType: CustodianType.ECA3,
            token: 'mock-token',
            refreshTokenUrl: 'https://example.com/refresh',
            custodianApiUrl: 'https://example.com/api',
            custodianEnvironment: 'test',
            custodianDisplayName: 'Test Custodian',
          },
          id: 1,
          jsonrpc: '2.0',
        },
      });

      // the renderOnboarding function should only be shown the non-existing accounts
      expect(mockRenderOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          accounts: [],
        }),
      );
    });
  });

  describe('onKeyringRequest', () => {
    it('should throw UnauthorizedError for unauthorized origin', async () => {
      await expect(
        onKeyringRequest({
          origin: 'unauthorized-origin',
          request: {
            method: 'keyring_listAccounts',
            params: {},
            id: 1,
            jsonrpc: '2.0',
          },
        }),
      ).rejects.toThrow(
        "Origin 'unauthorized-origin' is not allowed to call 'keyring_listAccounts'",
      );
    });

    it('should handle keyring request successfully', async () => {
      const mockRequest = {
        method: 'keyring_listAccounts',
        params: {},
        id: 1,
        jsonrpc: '2.0',
      };

      await onKeyringRequest({
        origin: 'https://example.com',
        request: mockRequest as JsonRpcRequest,
      });

      expect(handleKeyringRequest).toHaveBeenCalledWith(
        mockKeyring,
        mockRequest,
      );
    });
  });

  describe('onCronjob', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    beforeEach(() => {
      setTimeoutSpy.mockImplementation((fn) => {
        fn();
        return 0 as any;
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not poll when client is locked', async () => {
      // Override the mock for this specific test
      mockGetClientStatus.mockResolvedValueOnce({ locked: true });

      await onCronjob({
        request: {
          method: 'execute',
          id: 1,
          jsonrpc: '2.0',
        },
      });

      expect(mockRequestManager.poll).not.toHaveBeenCalled();
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should poll when client is unlocked', async () => {
      await onCronjob({
        request: {
          method: 'execute',
          id: 1,
          jsonrpc: '2.0',
        },
      });

      expect(mockRequestManager.poll).toHaveBeenCalled();
      expect(setTimeoutSpy).toHaveBeenCalledTimes(5); // 5 delays between 6 polls
    });

    it('should handle execute method', async () => {
      await onCronjob({
        request: {
          method: 'execute',
          id: 1,
          jsonrpc: '2.0',
        },
      });

      expect(mockRequestManager.poll).toHaveBeenCalled();
      expect(setTimeoutSpy).toHaveBeenCalledTimes(5); // 5 delays between 6 polls
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    });

    it('should throw error for unsupported method', async () => {
      await expect(
        onCronjob({
          request: {
            method: 'unsupported',
            id: 1,
            jsonrpc: '2.0',
          },
        }),
      ).rejects.toThrow('Method not found.');

      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should poll multiple times with correct delay', async () => {
      await onCronjob({
        request: {
          method: 'execute',
          id: 1,
          jsonrpc: '2.0',
        },
      });

      expect(mockRequestManager.poll).toHaveBeenCalledTimes(6);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(5); // 5 delays between 6 polls
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(
        expect.any(Function),
        10000,
      );

      // Verify all setTimeout calls were with 10 second delay
      for (let i = 0; i < 5; i++) {
        expect(setTimeoutSpy).toHaveBeenNthCalledWith(
          i + 1,
          expect.any(Function),
          10000,
        );
      }
    });
  });
});
