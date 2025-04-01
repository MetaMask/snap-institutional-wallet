import { MethodNotFoundError } from '@metamask/snaps-sdk';

import { CustodialKeyring } from './keyring';
import { TOKEN_EXPIRED_EVENT } from './lib/custodian-types/constants';
import { CustodianApiMap, CustodianType } from './lib/types/CustodianType';
import type { ICustodianApi } from './lib/types/ICustodianApi';

// Mock dependencies
jest.mock('./lib/custodian-types/custodianMetadata', () => ({
  custodianMetadata: [
    {
      apiBaseUrl: 'https://mock-url.com',
      apiVersion: 'ECA3',
      production: true,
      custodianPublishesTransaction: false,
      iconUrl: 'https://mock-url.com/icon.svg',
      displayName: 'Test Custodian',
      name: 'test-custodian',
    },
  ],
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

jest.mock('./config', () => ({
  config: {
    dev: false,
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
      const mockAccount = {
        id: '1',
        address: '0x123',
        options: {
          custodian: { importOrigin: 'test-origin' },
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
    const mockAccountId = '3ae4b404-8cdb-4c5c-bcd9-ec904f2a9876';

    const mockAccount = {
      id: mockAccountId,
      address: '0x123',
      methods: ['personal_sign', 'eth_signTransaction'],
      options: {
        custodian: {
          displayName: 'Test Custodian',
          deferPublication: false,
          importOrigin: 'test-origin',
        },
      },
    };

    beforeEach(() => {
      mockStateManager.getAccount.mockResolvedValue(mockAccount);
    });

    it('should throw error when account is not found', async () => {
      mockStateManager.getAccount.mockResolvedValue(null);

      const mockRequest = {
        id: '1cf42f0b-2512-4b6b-b5a5-138d9cbfa0e1',
        scope: 'scope-1',
        account: mockAccountId,
        request: {
          method: 'personal_sign',
          params: ['message', '0x123'],
        },
      };

      await expect(keyring.submitRequest(mockRequest)).rejects.toThrow(
        `Account '${mockAccountId}' not found`,
      );
    });

    it('should throw error when method is not supported by account', async () => {
      const mockRequest = {
        id: '1cf42f0b-2512-4b6b-b5a5-138d9cbfa0e1',
        scope: 'scope-1',
        account: mockAccountId,
        request: {
          method: 'eth_signTypedData_v4',
          params: ['message', mockAccount.address],
        },
      };

      await expect(keyring.submitRequest(mockRequest)).rejects.toThrow(
        `Method 'eth_signTypedData_v4' not supported for account '${mockAccount.address}'`,
      );
    });

    it('should handle personal sign request when method is supported', async () => {
      const mockRequest = {
        id: '1cf42f0b-2512-4b6b-b5a5-138d9cbfa0e1',
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
            options: {
              custodian: {
                importOrigin: 'test-origin',
              },
            },
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
            options: {
              custodian: {
                importOrigin: 'test-origin',
              },
            },
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
            options: {
              custodian: {
                importOrigin: 'test-origin',
              },
            },
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
            options: {
              custodian: {
                importOrigin: 'test-origin',
              },
            },
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
          options: {
            custodian: {
              importOrigin: 'test-origin',
            },
          },
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

        const result = await keyring.getConnectedAccounts(details, origin);
        expect(result).toStrictEqual([]);
      });
    });
  });

  describe('createAccount', () => {
    const mockAccountDetails = {
      name: 'Test Account',
      address: '0x123',
      details: {
        token: 'test-token',
        custodianType: CustodianType.ECA3,
        custodianEnvironment: 'test',
        custodianApiUrl: 'https://mock-url.com',
        refreshTokenUrl: 'https://refresh.example.com',
        custodianDisplayName: 'Test Custodian',
      },
      origin: 'test-origin',
    };

    beforeEach(() => {
      // Add this mock to return empty array by default
      mockStateManager.listWallets.mockResolvedValue([]);
    });

    it('should create a new account successfully', async () => {
      const mockCustodianApi = {
        getSupportedChains: jest.fn().mockResolvedValue(['eip155:1']),
        on: jest.fn(),
      };

      jest
        .spyOn(keyring as any, 'getCustodianApiForAddress')
        .mockResolvedValue(mockCustodianApi);

      mockStateManager.addWallet.mockResolvedValue(undefined);

      const result = await keyring.createAccount(mockAccountDetails);

      expect(result).toMatchObject({
        address: '0x123',
        methods: expect.arrayContaining([
          'eth_signTransaction',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
          'personal_sign',
        ]),
        options: {
          custodian: {
            displayName: 'Test Custodian',
            importOrigin: mockAccountDetails.origin,
          },
        },
      });

      expect(mockStateManager.addWallet).toHaveBeenCalledWith(
        expect.objectContaining({
          account: expect.objectContaining({
            address: '0x123',
          }),
        }),
      );
    });

    it('should throw error if custodianType is not supported', async () => {
      const invalidDetails = {
        ...mockAccountDetails,
        details: {
          ...mockAccountDetails.details,
          custodianType: 'UnsupportedType',
        },
      };

      await expect(
        keyring.createAccount(invalidDetails as any),
      ).rejects.toThrow(/Expected one of/u);
    });

    it('should create account with correct wallet details', async () => {
      const mockCustodianApi = {
        getSupportedChains: jest.fn().mockResolvedValue(['eip155:1']),
        on: jest.fn(),
      };

      jest
        .spyOn(keyring as any, 'getCustodianApiForAddress')
        .mockResolvedValue(mockCustodianApi);

      mockStateManager.withTransaction.mockImplementation((callback: any) =>
        callback(),
      );
      mockStateManager.addWallet.mockResolvedValue(undefined);

      await keyring.createAccount(mockAccountDetails);

      expect(mockStateManager.addWallet).toHaveBeenCalledWith({
        account: expect.objectContaining({
          address: '0x123',
          methods: expect.arrayContaining([
            'eth_signTransaction',
            'personal_sign',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ]),
          options: {
            accountName: 'Test Account',
            custodian: {
              environmentName: 'test-custodian',
              displayName: 'Test Custodian',
              importOrigin: 'test-origin',
              deferPublication: false,
            },
          },
          type: 'eip155:eoa',
        }),
        details: {
          token: mockAccountDetails.details.token,
          custodianApiUrl: mockAccountDetails.details.custodianApiUrl,
          custodianType: mockAccountDetails.details.custodianType,
          refreshTokenUrl: mockAccountDetails.details.refreshTokenUrl,
          custodianEnvironment: mockAccountDetails.details.custodianEnvironment,
          custodianDisplayName: mockAccountDetails.details.custodianDisplayName,
        },
      });
    });

    it('should throw error if address already exists', async () => {
      mockStateManager.listWallets.mockResolvedValue([
        {
          account: {
            address: '0x123', // Same address as in mockAccountDetails
          },
        },
      ]);

      await expect(keyring.createAccount(mockAccountDetails)).rejects.toThrow(
        /Account address already in use/u,
      );
    });

    it('should throw if config.dev is false and createAccount is called with a custodial API URL that is not in the custodianMetadata', async () => {
      const mockCustodianApi = {
        getSupportedChains: jest.fn().mockResolvedValue(['eip155:1']),
        on: jest.fn(),
      };

      jest
        .spyOn(keyring as any, 'getCustodianApiForAddress')
        .mockResolvedValue(mockCustodianApi);

      const invalidAccountDetails = {
        ...mockAccountDetails,
        details: {
          ...mockAccountDetails.details,
          custodianApiUrl: 'https://invalid-url.com', // URL that's not in custodianMetadata
        },
      };

      await expect(
        keyring.createAccount(invalidAccountDetails),
      ).rejects.toThrow(
        'No custodian allowlisted for API URL: https://invalid-url.com',
      );
    });

    it('should use the custodian info from the onboarding request if config.dev is true', async () => {
      const mockCustodianApi = {
        getSupportedChains: jest.fn().mockResolvedValue(['eip155:1']),
        on: jest.fn(),
      };

      jest
        .spyOn(keyring as any, 'getCustodianApiForAddress')
        .mockResolvedValue(mockCustodianApi);

      const result = await keyring.createAccount({
        ...mockAccountDetails,
        details: {
          ...mockAccountDetails.details,
          custodianEnvironment: 'test-user-supplied',
          custodianDisplayName: 'Test Custodian User Supplied',
        },
      });

      expect(result).toMatchObject({
        options: {
          custodian: {
            environmentName: 'test-custodian', // i.e do NOT use the user supplied environment name
            displayName: 'Test Custodian User Supplied', // i.e. DO use the user supplied display name
          },
        },
      });
    });
  });
});
