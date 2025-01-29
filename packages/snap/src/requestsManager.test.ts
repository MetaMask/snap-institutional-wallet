/* eslint-disable @typescript-eslint/unbound-method */
import type {
  CustodialSnapRequest,
  SignedMessageRequest,
  TransactionRequest,
} from './lib/structs/CustodialKeyringStructs';
import { RequestManager } from './requestsManager';
import type { KeyringStateManager } from './stateManagement';

type KeyringFacade = {
  getCustodianApiForAddress: jest.Mock;
  getAccount: jest.Mock;
};

describe('RequestManager', () => {
  const createMockRequest = (
    id: string,
    chainId?: string,
  ): CustodialSnapRequest<SignedMessageRequest | TransactionRequest> => ({
    lastUpdated: Date.now(),
    keyringRequest: {
      id,
      scope: 'eip155:eoa',
      account: '0x123',
      request: {
        method: 'eth_signTransaction',
        params: [
          {
            chainId: chainId ?? null,
            to: '0x123',
            value: '0x00',
            data: '0x',
          },
        ],
      },
    },
    type: 'transaction',
    transaction: {
      from: '0x123',
      transactionStatus: {
        finished: false,
        success: false,
        displayText: '',
        submitted: false,
        signed: false,
      },
      custodianTransactionId: 'mock-id',
      custodianPublishesTransaction: false,
    },
    fulfilled: false,
    rejected: false,
  });

  let stateManager: jest.Mocked<KeyringStateManager>;
  let keyringFacade: jest.Mocked<KeyringFacade>;
  let requestManager: RequestManager;

  beforeEach(() => {
    stateManager = {
      upsertRequest: jest.fn(),
      listRequests: jest.fn(),
      clearAllRequests: jest.fn(),
      getRequest: jest.fn(),
    } as unknown as jest.Mocked<KeyringStateManager>;

    keyringFacade = {
      getCustodianApiForAddress: jest.fn(),
      getAccount: jest.fn(),
    } as unknown as jest.Mocked<KeyringFacade>;

    requestManager = new RequestManager(stateManager, keyringFacade);
  });

  describe('upsertRequest', () => {
    it('should forward upsert request to state manager', async () => {
      const request = createMockRequest('test-id');
      await requestManager.upsertRequest(request);

      expect(stateManager.upsertRequest).toHaveBeenCalledWith(request);
      expect(stateManager.upsertRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('listRequests', () => {
    it('should forward list requests to state manager', async () => {
      const mockRequests = [
        createMockRequest('test-id-1'),
        createMockRequest('test-id-2'),
      ];
      stateManager.listRequests.mockResolvedValue(mockRequests);

      const result = await requestManager.listRequests();

      expect(result).toStrictEqual(mockRequests);
      expect(stateManager.listRequests).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAllRequests', () => {
    it('should forward clear all requests to state manager', async () => {
      await requestManager.clearAllRequests();

      expect(stateManager.clearAllRequests).toHaveBeenCalledTimes(1);
    });
  });

  describe('getChainIdFromPendingRequest', () => {
    it('should return chainId from request params', async () => {
      const request = createMockRequest('test-id', '0x1');
      stateManager.getRequest.mockResolvedValue(request);

      const result = await requestManager.getChainIdFromPendingRequest(
        'test-id',
      );

      expect(result).toBe('0x1');
      expect(stateManager.getRequest).toHaveBeenCalledWith('test-id');
    });

    it('should throw error if request not found', async () => {
      stateManager.getRequest.mockResolvedValue(null);

      await expect(
        requestManager.getChainIdFromPendingRequest('test-id'),
      ).rejects.toThrow('Request test-id not found');
    });

    it('should throw error if request has no chainId', async () => {
      const request = createMockRequest('test-id');
      stateManager.getRequest.mockResolvedValue(request);

      await expect(
        requestManager.getChainIdFromPendingRequest('test-id'),
      ).rejects.toThrow('Request test-id has no chainId');
    });
  });

  describe('getRequestParams', () => {
    it('should return request params', async () => {
      const request = createMockRequest('test-id', '0x1');
      stateManager.getRequest.mockResolvedValue(request);

      const result = await requestManager.getRequestParams('test-id');

      expect(result).toStrictEqual({
        chainId: '0x1',
        to: '0x123',
        value: '0x00',
        data: '0x',
      });
    });

    it('should throw error if request not found', async () => {
      stateManager.getRequest.mockResolvedValue(null);

      await expect(requestManager.getRequestParams('test-id')).rejects.toThrow(
        'Request test-id not found',
      );
    });

    it('should throw error if request params are invalid', async () => {
      const invalidRequest = {
        ...createMockRequest('test-id'),
        keyringRequest: {
          id: 'test-id',
          request: {
            method: 'eth_signTransaction',
            params: [], // Empty params
          },
        },
      };
      stateManager.getRequest.mockResolvedValue(invalidRequest as any);

      await expect(requestManager.getRequestParams('test-id')).rejects.toThrow(
        'Request test-id has invalid params',
      );
    });
  });
});
