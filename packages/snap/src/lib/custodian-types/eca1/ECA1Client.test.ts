/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/naming-convention */
import fetchMock from 'jest-fetch-mock';

import { ECA1Client } from './ECA1Client';
import { SimpleCache } from '../../simple-cache';
import { TOKEN_EXPIRED_EVENT } from '../constants';
import { mockECA1CreateTransactionPayload } from './mocks/mockECA1CreateTransactionPayload';
import { mockECA1GetSignedMessageByIdPayload } from './mocks/mockECA1GetSignedMessageByIdPayload';
import { mockECA1GetTransactionByIdPayload } from './mocks/mockECA1GetTransactionByIdPayload';
import { mockECA1GetTransactionLinkPayload } from './mocks/mockECA1GetTransactionLinkPayload';
import { mockECA1SignPayload } from './mocks/mockECA1SignPayload';
import { mockECA1SignTypedDataPayload } from './mocks/mockECA1SignTypedDataPayload';

// So that we can access the method returned by the call factory
const jsonRpcCall = jest
  .fn()
  .mockImplementation(
    async (_method: string, _params: any, _accessToken: string) => {
      return Promise.resolve({
        data: { result: 'test' },
      });
    },
  );

// Mock the json-rpc-call factory
jest.mock('../../../util/json-rpc-call', () => ({
  __esModule: true,
  default: (_url: string) => jsonRpcCall,
}));

jest.mock('../../simple-cache/SimpleCache');

fetchMock.enableMocks();

describe('ECA1Client', () => {
  let client: ECA1Client;

  const mockedSimpleCache = jest.mocked(SimpleCache);
  let mockedSimpleCacheInstance: SimpleCache;
  const hashedToken =
    'd704d4eab860b9793d8b1c03c0a0d4657908d48a5bd4b7fe0da82430b9e23e23';

  beforeEach(() => {
    jest.resetAllMocks();
    mockedSimpleCache.mockClear();
    fetchMock.resetMocks();

    client = new ECA1Client(
      'http://test/json-rpc',
      'refresh_token',
      'http://refresh-token-url',
    );

    mockedSimpleCacheInstance = mockedSimpleCache.mock
      .instances[0] as SimpleCache;

    fetchMock.mockResponse(
      JSON.stringify({
        access_token: 'accesstoken',
        expires_in: 10,
        refresh_token: 'refresh_token',
      }),
    );
  });

  describe('getAccessToken', () => {
    it('should call the refresh token URL and return the access token', async () => {
      const result = await client.getAccessToken();

      expect(fetchMock).toHaveBeenCalledWith('http://refresh-token-url', {
        body: 'grant_type=refresh_token&refresh_token=refresh_token',
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      expect(result).toBe('accesstoken');
    });

    it('should return the cached version if there is a cached version', async () => {
      // Run once to set the expires_in
      await client.getAccessToken();

      jest
        .spyOn(mockedSimpleCacheInstance, 'cacheExists')
        .mockImplementation()
        .mockReturnValue(true);
      jest
        .spyOn(mockedSimpleCacheInstance, 'cacheValid')
        .mockImplementation()
        .mockReturnValue(false);
      jest
        .spyOn(mockedSimpleCacheInstance, 'getCache')
        .mockImplementation()
        .mockReturnValue('cached');

      const result = await client.getAccessToken();

      expect(result).toBe('accesstoken');
    });

    it('should not return the cached version if there is a cached version but it is invalid', async () => {
      // Run once to set the expires_in
      await client.getAccessToken();

      jest
        .spyOn(mockedSimpleCacheInstance, 'cacheExists')
        .mockImplementation()
        .mockReturnValue(true);
      jest
        .spyOn(mockedSimpleCacheInstance, 'cacheValid')
        .mockImplementation()
        .mockReturnValue(true);
      jest
        .spyOn(mockedSimpleCacheInstance, 'getCache')
        .mockImplementation()
        .mockReturnValue('cached');

      const result = await client.getAccessToken();

      expect(result).toBe('cached');
    });

    it('throws an error if there is a HTTP error', async () => {
      fetchMock.mockRejectedValue(new Error('HTTP error'));

      await expect(client.getAccessToken()).rejects.toThrow('HTTP error');
    });

    it('emit an ITR event if there is a HTTP 401 error status', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          error: {
            message: 'Test error',
          },
        }),
      );

      const messageHandler = jest.fn();

      client.on(TOKEN_EXPIRED_EVENT, messageHandler);

      try {
        await client.getAccessToken();
      } catch (error) {
        await new Promise((resolve, _reject) => {
          setTimeout(() => {
            expect(messageHandler).toHaveBeenCalledWith({
              url: 'test',
              oldRefreshToken: hashedToken,
            });
            resolve(null);
          }, 100);
        });

        await expect(client.getAccessToken()).rejects.toThrow(
          'Refresh token provided is no longer valid.',
        );
      }
    });
  });

  describe('listAccounts', () => {
    it('should call the custodian_listAccounts method on the json rpc caller', async () => {
      await client.listAccounts();
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_listAccounts',
        {},
        'accesstoken',
      );
    });
  });

  describe('getCustomerProof', () => {
    it('should call the custodian_getCustomerProof method on the json rpc caller', async () => {
      await client.getCustomerProof();
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_getCustomerProof',
        {},
        'accesstoken',
      );
    });
  });

  describe('createTransaction', () => {
    it('should call the custodian_createTransaction method on the json rpc caller', async () => {
      await client.createTransaction(mockECA1CreateTransactionPayload);

      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_createTransaction',
        mockECA1CreateTransactionPayload,
        'accesstoken',
      );
    });
  });

  describe('listAccountChainIds', () => {
    it('should call the custodian_listAccountChainIds method on the json rpc caller', async () => {
      await client.getAccountChainIds(['0xtest']);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_listAccountChainIds',
        ['0xtest'],
        'accesstoken',
      );
    });
  });

  describe('signPersonalMessage', () => {
    it('should call the custodian_sign method on the json rpc caller', async () => {
      await client.signPersonalMessage(mockECA1SignPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_sign',
        mockECA1SignPayload,
        'accesstoken',
      );
    });
  });

  describe('signTypedData', () => {
    it('should call the custodian_signTypedData method on the json rpc caller', async () => {
      await client.signTypedData(mockECA1SignTypedDataPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_signTypedData',
        mockECA1SignTypedDataPayload,
        'accesstoken',
      );
    });
  });

  describe('getSignedMessageBy', () => {
    it('should call the custodian_getSignedMessageById method on the json rpc caller', async () => {
      await client.getSignedMessage(mockECA1GetSignedMessageByIdPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_getSignedMessageById',
        mockECA1GetSignedMessageByIdPayload,
        'accesstoken',
      );
    });
  });

  describe('getTransaction', () => {
    it('should call the custodian_getTransactionById method on the json rpc caller', async () => {
      await client.getTransaction(mockECA1GetTransactionByIdPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_getTransactionById',
        mockECA1GetTransactionByIdPayload,
        'accesstoken',
      );
    });
  });

  describe('getTransactionLink', () => {
    it('should call the custodian_getTransactionLink method on the json rpc caller', async () => {
      await client.getTransactionLink(mockECA1GetTransactionLinkPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_getTransactionLink',
        mockECA1GetTransactionLinkPayload,
        'accesstoken',
      );
    });
  });
});
