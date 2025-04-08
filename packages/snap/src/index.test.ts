import type { JsonRpcRequest } from '@metamask/keyring-api';
import { handleKeyringRequest } from '@metamask/keyring-api';

import { onRpcRequest, onKeyringRequest, onCronjob } from '.';
import { getKeyring, getRequestManager, getStateManager } from './context';
import { renderErrorMessage } from './features/error-message/render';
import { renderOnboarding } from './features/onboarding/render';
import { CustodianType } from './lib/types/CustodianType';
import { InternalMethod, originPermissions } from './permissions';
import { getClientStatus } from './snap-state-manager/snap-util';
import type { KeyringStateManager } from './stateManagement';
import { getSleepState, setSleepState } from './util/sleep';

// Mock the context module
jest.mock('./context', () => ({
  getKeyring: jest.fn(),
  getRequestManager: jest.fn(),
  getStateManager: jest.fn(),
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

jest.mock('./snap-state-manager/snap-util');

// Mock the sleep state
jest.mock('./util/sleep', () => ({
  getSleepState: jest.fn().mockResolvedValue(false),
  setSleepState: jest.fn(),
}));

const mockGetSleepState = getSleepState as jest.MockedFunction<
  typeof getSleepState
>;

// Add type assertion for the mock
const mockGetClientStatus = getClientStatus as jest.MockedFunction<
  typeof getClientStatus
>;

// Mock the state manager
const mockStateManager = {
  getActivated: jest.fn<Promise<boolean>, []>().mockResolvedValue(false),
  setActivated: jest
    .fn<Promise<void>, [boolean]>()
    .mockResolvedValue(undefined),
  get: jest.fn(),
  listAccounts: jest.fn(),
  listWallets: jest.fn(),
  addWallet: jest.fn(),
  removeWallet: jest.fn(),
  updateWalletDetails: jest.fn(),
  clearState: jest.fn(),
} as unknown as KeyringStateManager;

// Import getStateManager from context and create mock reference
const mockGetStateManager = getStateManager as jest.MockedFunction<
  typeof getStateManager
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
    mockGetStateManager.mockResolvedValue(mockStateManager);

    // Set up permissions for example.com
    originPermissions.set(
      'https://example.com',
      new Set([
        InternalMethod.Onboard,
        'keyring_listAccounts',
        InternalMethod.GetIsSupported,
      ]),
    );

    // Reset the mock implementation for each test
    mockRenderOnboarding.mockImplementation(async () => [
      {
        address: '0x123',
        name: 'Test Account',
      },
    ]);

    // Set default mock return values
    mockGetClientStatus.mockResolvedValue({ locked: false });
    (mockStateManager.getActivated as jest.Mock).mockResolvedValue(false);
    (mockStateManager.setActivated as jest.Mock).mockResolvedValue(undefined);
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

    it('should return true for getIsSupported', async () => {
      const result = await onRpcRequest({
        origin: 'https://example.com',
        request: {
          method: InternalMethod.GetIsSupported,
          params: {},
          id: 1,
          jsonrpc: '2.0',
        },
      });
      expect(result).toBe(true);
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
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset default mock values for each test
      mockGetClientStatus.mockResolvedValue({ locked: false });
      mockGetSleepState.mockResolvedValue(false);
    });

    describe('execute method', () => {
      it('should not poll when snap is asleep', async () => {
        // Mock sleep state to be true (asleep)
        mockGetSleepState.mockResolvedValueOnce(true);

        await onCronjob({
          request: {
            method: 'execute',
            id: 1,
            jsonrpc: '2.0',
          },
        });

        expect(mockRequestManager.poll).not.toHaveBeenCalled();
        expect(mockGetClientStatus).not.toHaveBeenCalled(); // Shouldn't even check client status
      });

      it('should go to sleep when client is locked', async () => {
        // Mock sleep state to be false (awake)
        mockGetSleepState.mockResolvedValueOnce(false);
        // Mock client to be locked
        mockGetClientStatus.mockResolvedValueOnce({ locked: true });

        await onCronjob({
          request: {
            method: 'execute',
            id: 1,
            jsonrpc: '2.0',
          },
        });

        expect(setSleepState).toHaveBeenCalledWith(true);
        expect(mockRequestManager.poll).not.toHaveBeenCalled();
      });

      it('should poll when awake and client is unlocked', async () => {
        // Mock sleep state to be false (awake)
        mockGetSleepState.mockResolvedValueOnce(false);
        // Mock client to be unlocked
        mockGetClientStatus.mockResolvedValueOnce({ locked: false });
        // Mock snap to be activated
        (mockStateManager.getActivated as jest.Mock).mockResolvedValueOnce(
          true,
        );

        await onCronjob({
          request: {
            method: 'execute',
            id: 1,
            jsonrpc: '2.0',
          },
        });

        expect(mockRequestManager.poll).toHaveBeenCalled();
        expect(setSleepState).not.toHaveBeenCalled(); // Shouldn't change sleep state
      });
    });

    describe('manageSleepState method', () => {
      it('should set sleep when client is locked', async () => {
        mockGetClientStatus.mockResolvedValueOnce({ locked: true });

        await onCronjob({
          request: {
            method: 'manageSleepState',
            id: 1,
            jsonrpc: '2.0',
          },
        });

        expect(setSleepState).toHaveBeenCalledWith(true);
      });

      it('should wake up when client is unlocked and snap is activated', async () => {
        mockGetClientStatus.mockResolvedValueOnce({ locked: false });
        (mockStateManager.getActivated as jest.Mock).mockResolvedValueOnce(
          true,
        );

        await onCronjob({
          request: {
            method: 'manageSleepState',
            id: 1,
            jsonrpc: '2.0',
          },
        });

        expect(setSleepState).toHaveBeenCalledWith(false);
      });

      it('should sleep when client is unlocked but snap is not activated', async () => {
        mockGetClientStatus.mockResolvedValueOnce({ locked: false });
        (mockStateManager.getActivated as jest.Mock).mockResolvedValueOnce(
          false,
        );

        await onCronjob({
          request: {
            method: 'manageSleepState',
            id: 1,
            jsonrpc: '2.0',
          },
        });

        expect(setSleepState).toHaveBeenCalledWith(true);
      });
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
    });
  });
});
