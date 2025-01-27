import { onRpcRequest } from '.';
import { getKeyring, getRequestManager } from './context';
import { CustodianType } from './lib/types/CustodianType';
import { InternalMethod, originPermissions } from './permissions';

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
  renderOnboarding: jest.fn().mockResolvedValue([
    {
      address: '0x123',
      name: 'Test Account',
    },
  ]),
}));

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
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    (getKeyring as jest.Mock).mockResolvedValue(mockKeyring);
    (getRequestManager as jest.Mock).mockResolvedValue(mockRequestManager);

    // Set up permissions for example.com
    originPermissions.set(
      'https://example.com',
      new Set([InternalMethod.Onboard]),
    );
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
        });
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
    });
  });
});
