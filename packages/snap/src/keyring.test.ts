import { MethodNotFoundError } from '@metamask/snaps-sdk';

import { CustodialKeyring } from './keyring';
import { TOKEN_EXPIRED_EVENT } from './lib/custodian-types/constants';
import { CustodianApiMap, CustodianType } from './lib/types/CustodianType';
import type { ICustodianApi } from './lib/types/ICustodianApi';

// Mock dependencies
jest.mock('./lib/custodian-types/custodianMetadata', () => ({
  custodianMetadata: {
    BitGo: {
      production: false,
      apiBaseUrl: 'https://mock-url.com',
      apiVersion: 'BitGo',
      custodianPublishesTransaction: true,
      iconUrl: 'https://mock-url.com/icon.svg',
    },
    ECA3: {
      production: true,
      apiBaseUrl: 'https://mock-url.com',
      apiVersion: 'ECA3',
      custodianPublishesTransaction: false,
      iconUrl: 'https://mock-url.com/icon.svg',
    },
  },
}));

jest.mock('./features/info-message/rendex');
jest.mock('@metamask/keyring-api', () => ({
  ...jest.requireActual('@metamask/keyring-api'),
  emitSnapKeyringEvent: jest.fn(),
}));

jest.mock('./lib/types/CustodianType', () => ({
  CustodianType: {
    ECA3: 'ECA3',
    ECA1: 'ECA1',
    BitGo: 'BitGo',
    Cactus: 'Cactus',
  },
  CustodianApiMap: {
    ECA3: jest.fn(),
  },
}));

describe('CustodialKeyring', () => {
  let keyring: CustodialKeyring;
  let mockStateManager: any;
  let mockRequestManager: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock state manager
    mockStateManager = {
      listAccounts: jest.fn(),
      getAccount: jest.fn(),
      withTransaction: jest.fn(),
      removeAccounts: jest.fn(),
      getWalletByAddress: jest.fn(),
      listWallets: jest.fn(),
      updateWalletDetails: jest.fn(),
      addWallet: jest.fn(),
    };

    // Setup mock request manager
    mockRequestManager = {
      upsertRequest: jest.fn(),
      listRequests: jest.fn(),
    };

    // Create keyring instance
    keyring = new CustodialKeyring(mockStateManager, mockRequestManager);
  });

  describe('listAccounts', () => {
    it('should return accounts from state manager', async () => {
      const mockAccounts = [{ id: '1', address: '0x123' }];
      mockStateManager.listAccounts.mockResolvedValue(mockAccounts);

      const result = await keyring.listAccounts();
      expect(result).toStrictEqual(mockAccounts);
      expect(mockStateManager.listAccounts).toHaveBeenCalled();
    });
  });

  describe('getAccount', () => {
    it('should return account from state manager', async () => {
      const mockAccount = { id: '1', address: '0x123' };
      mockStateManager.getAccount.mockResolvedValue(mockAccount);

      const result = await keyring.getAccount('1');
      expect(result).toStrictEqual(mockAccount);
      expect(mockStateManager.getAccount).toHaveBeenCalledWith('1');
    });

    it('should return undefined for non-existent account', async () => {
      mockStateManager.getAccount.mockResolvedValue(null);

      const result = await keyring.getAccount('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('filterAccountChains', () => {
    it('should filter supported chains', async () => {
      const mockAccount = { id: '1', address: '0x123' };
      const mockWallet = {
        account: mockAccount,
        details: {
          custodianType: 'ECA3',
          token: 'mock-token',
          custodianApiUrl: 'https://api.example.com',
          refreshTokenUrl: 'https://refresh.example.com',
        },
      };

      mockStateManager.getAccount.mockResolvedValue(mockAccount);
      mockStateManager.getWalletByAddress.mockResolvedValue(mockWallet);

      // Mock the custodian API to return decimal chain IDs
      const mockCustodianApi = {
        getSupportedChains: jest.fn().mockResolvedValue(['eip155:1']), // CAIP-2 format
      };

      jest
        .spyOn(keyring as any, 'getCustodianApiForAddress')
        .mockImplementation(async () => Promise.resolve(mockCustodianApi));

      const result = await keyring.filterAccountChains('1', ['0x1', '0x2']);
      expect(result).toStrictEqual(['0x1']);
    });

    it('should throw error for non-existent account', async () => {
      mockStateManager.getAccount.mockResolvedValue(null);

      await expect(keyring.filterAccountChains('1', [])).rejects.toThrow(
        "Account '1' not found",
      );
    });
  });

  describe('updateAccount', () => {
    it('should throw MethodNotFoundError', async () => {
      await expect(keyring.updateAccount({} as any)).rejects.toThrow(
        MethodNotFoundError,
      );
    });
  });

  describe('deleteAccount', () => {
    it('should delete account and emit event', async () => {
      mockStateManager.withTransaction.mockImplementation((callback: any) =>
        callback(),
      );

      await keyring.deleteAccount('1');

      expect(mockStateManager.removeAccounts).toHaveBeenCalledWith(['1']);
      expect(mockStateManager.withTransaction).toHaveBeenCalled();
    });
  });

  describe('submitRequest', () => {
    it('should handle personal sign request', async () => {
      const mockAccount = {
        id: '1',
        address: '0x123',
        options: {
          custodian: {
            displayName: 'Test Custodian',
            deferPublication: false,
          },
        },
      };
      const mockRequest = {
        id: 'request-1',
        scope: 'scope-1',
        account: mockAccount.id,
        request: {
          method: 'personal_sign',
          params: ['message', mockAccount.address],
        },
      };

      const mockWallet = {
        account: mockAccount,
        details: {
          custodianType: 'ECA3',
          token: 'mock-token',
          custodianApiUrl: 'https://api.example.com',
          refreshTokenUrl: 'https://refresh.example.com',
        },
      };

      mockStateManager.getAccount.mockResolvedValue(mockAccount);
      mockStateManager.getWalletByAddress.mockResolvedValue(mockWallet);

      // Mock the custodian API
      const mockCustodianApi = {
        signPersonalMessage: jest.fn().mockResolvedValue({ id: 'msg-1' }),
        getSignedMessageLink: jest.fn().mockResolvedValue({
          text: 'View Message',
          id: 'msg-1',
          url: 'https://example.com',
          action: 'view',
        }),
      };
      jest
        .spyOn(keyring as any, 'getCustodianApiForAddress')
        .mockResolvedValue(mockCustodianApi);

      const result = await keyring.submitRequest(mockRequest);

      expect(result).toStrictEqual({ pending: true });
      expect(mockRequestManager.upsertRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'message',
          subType: 'personalSign',
        }),
      );
    });

    // Add more tests for other request types...
  });

  describe('getCustodianApiForAddress', () => {
    it('should normalize address', async () => {
      const address = '0xf7bDe8609231033c69E502C08f85153f8A1548F2';
      const addressUpper = '0xF7BDE8609231033C69E502C08F85153F8A1548F2';

      const mockWallets = [
        {
          account: { id: '1', address },
          details: {
            token: 'oldToken',
            custodianApiUrl: 'https://api.example.com',
            custodianType: 'ECA3',
            refreshTokenUrl: 'https://refresh.example.com',
            importOrigin: 'test-origin',
          },
        },
      ];

      mockStateManager.getWalletByAddress.mockImplementation(
        async (accountAddress: string) => {
          return Promise.resolve(
            mockWallets.find(
              (wallet) => wallet.account.address === accountAddress,
            ),
          );
        },
      );

      mockStateManager.listWallets.mockImplementation(async () => {
        return Promise.resolve(mockWallets);
      });

      const mockCustodianApi: Partial<ICustodianApi> = {
        on: jest.fn(),
        getSupportedChains: jest.fn(),
      };

      const ECA3Mock =
        CustodianApiMap.ECA3 as unknown as jest.Mock<ICustodianApi>;
      ECA3Mock.mockImplementation(() => mockCustodianApi as ICustodianApi);

      const result = await keyring.getCustodianApiForAddress(addressUpper);
      expect(result).toBeDefined();
    });

    it('should handle token expiry events and update wallet details', async () => {
      const mockAddress = '0x123';
      const mockWallets = [
        {
          account: {
            id: '1',
            address: mockAddress,
            options: { importOrigin: 'test-origin' },
          },
          details: {
            token: 'oldToken',
            custodianApiUrl: 'https://api.example.com',
            custodianType: 'ECA3',
            refreshTokenUrl: 'https://refresh.example.com',
          },
        },
        {
          account: {
            id: '2',
            address: '0x456',
            options: { importOrigin: 'test-origin' },
          },
          details: {
            token: 'oldToken',
            custodianApiUrl: 'https://api.example.com',
            custodianType: 'ECA3',
            refreshTokenUrl: 'https://refresh.example.com',
          },
        },
        {
          account: {
            id: '3',
            address: '0x789',
            options: { importOrigin: 'test-origin' },
          },
          details: {
            token: 'differentToken',
            custodianApiUrl: 'https://different.api.com',
            custodianType: 'ECA3',
            refreshTokenUrl: 'https://refresh.example.com',
          },
        },
      ];

      const updatedDetails = new Map();

      mockStateManager.getWalletByAddress.mockImplementation(
        async (address: string) => {
          return Promise.resolve(
            mockWallets.find((wallet) => wallet.account.address === address),
          );
        },
      );

      mockStateManager.listWallets.mockImplementation(async () => {
        return Promise.resolve(mockWallets);
      });

      mockStateManager.updateWalletDetails.mockImplementation(
        async (id: string, details: any) => {
          updatedDetails.set(id, { ...details });
          return Promise.resolve();
        },
      );

      let tokenEventCallback: ((event: any) => Promise<void>) | undefined;
      const mockCustodianApi: Partial<ICustodianApi> = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === TOKEN_EXPIRED_EVENT) {
            tokenEventCallback = callback;
          }
        }),
        getSupportedChains: jest.fn(),
      };

      const ECA3Mock =
        CustodianApiMap.ECA3 as unknown as jest.Mock<ICustodianApi>;
      ECA3Mock.mockImplementation(() => mockCustodianApi as ICustodianApi);

      // Call the method under test
      const api = await (keyring as any).getCustodianApiForAddress(mockAddress);

      // Simulate token expiry event and wait for all promises to resolve
      if (tokenEventCallback) {
        await tokenEventCallback({
          oldRefreshToken: 'oldToken',
          newRefreshToken: 'newToken',
          apiUrl: 'https://api.example.com',
        });
      }

      // Wait for any pending promises
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Verify each wallet update
      const expectedDetails = {
        token: 'newToken',
        custodianApiUrl: 'https://api.example.com',
        custodianType: 'ECA3',
        refreshTokenUrl: 'https://refresh.example.com',
      };

      expect(updatedDetails.get('1')).toStrictEqual(expectedDetails);
      expect(updatedDetails.get('2')).toStrictEqual(expectedDetails);
      expect(updatedDetails.has('3')).toBe(false);

      // Verify the event listener was set up
      expect(api.on).toHaveBeenCalledWith(
        TOKEN_EXPIRED_EVENT,
        expect.any(Function),
      );
    });
  });

  describe('getConnectedAccounts', () => {
    it('should return connected accounts', async () => {
      const mockWallets = [
        {
          account: {
            id: '1',
            address: '0x123',
            options: { importOrigin: 'test-origin' },
          },
          details: {
            token: 'token',
            custodianApiUrl: 'https://api.example.com',
            custodianType: 'ECA3',
            refreshTokenUrl: 'https://refresh.example.com',
            custodianEnvironment: 'test-environment',
          },
        },
      ];

      mockStateManager.listWallets.mockImplementation(async () => {
        return Promise.resolve(mockWallets);
      });

      const result = await keyring.getConnectedAccounts(
        {
          token: 'token',
          custodianApiUrl: 'https://api.example.com',
          custodianType: CustodianType.ECA3,
          custodianEnvironment: 'test-environment',
        },
        'test-origin',
      );
      expect(result).toStrictEqual([mockWallets[0]!.account]);
    });

    describe('should not return accounts if any of the details do not match', () => {
      const mockWallet = {
        account: {
          id: '1',
          address: '0x123',
          options: { importOrigin: 'test-origin' },
        },
        details: {
          token: 'token',
          custodianApiUrl: 'https://api.example.com',
          custodianType: CustodianType.ECA3,
          custodianEnvironment: 'test-environment',
        },
      };

      it.each([
        [
          'should not return accounts if the token does not match',
          {
            ...mockWallet.details,
            token: 'differentToken',
          },
          'test-origin',
        ],
        [
          'should not return accounts if the custodianApiUrl does not match',
          {
            ...mockWallet.details,
            custodianApiUrl: 'https://different.api.com',
          },
          'test-origin',
        ],
        [
          'should not return accounts if the custodianType does not match',
          {
            ...mockWallet.details,
            custodianType: CustodianType.ECA1,
          },
          'test-origin',
        ],
        [
          'should not return accounts if the custodianEnvironment does not match',
          {
            ...mockWallet.details,
            custodianEnvironment: 'different-environment',
          },
          'test-origin',
        ],
        [
          'should not return accounts if the importOrigin does not match',
          {
            ...mockWallet.details,
          },
          'different-origin',
        ],
      ])('%s', async (_, details, origin) => {
        mockStateManager.listWallets.mockImplementation(async () => {
          return Promise.resolve([mockWallet]);
        });

        console.log('details', details);

        const result = await keyring.getConnectedAccounts(details, origin);
        expect(result).toStrictEqual([]);
      });
    });
  });
});
