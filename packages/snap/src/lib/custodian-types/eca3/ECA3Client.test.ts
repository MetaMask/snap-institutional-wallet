/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/naming-convention */
import fetchMock from 'jest-fetch-mock';

import { ECA3Client } from './ECA3Client';
import { SimpleCache } from '../../simple-cache';
import { TOKEN_EXPIRED_EVENT } from '../constants';
import { mockECA3CreateTransactionPayload } from './mocks/mockECA3CreateTransactionPayload';
import { mockECA3GetSignedMessageByIdPayload } from './mocks/mockECA3GetSignedMessageByIdPayload';
import { mockECA3GetSignedMessageLinkPayload } from './mocks/mockECA3GetSignedMessageLinkPayload';
import { mockECA3GetTransactionByIdPayload } from './mocks/mockECA3GetTransactionByIdPayload';
import { mockECA3GetTransactionLinkPayload } from './mocks/mockECA3GetTransactionLinkPayload';
import { mockECA3SignPayload } from './mocks/mockECA3SignPayload';
import { mockECA3SignTypedDataPayload } from './mocks/mockECA3SignTypedDataPayload';

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

describe('ECA3Client', () => {
  let client: ECA3Client;

  const mockedSimpleCache = jest.mocked(SimpleCache);
  let mockedSimpleCacheInstance: SimpleCache;
  const hashedToken =
    'd704d4eab860b9793d8b1c03c0a0d4657908d48a5bd4b7fe0da82430b9e23e23';

  beforeEach(() => {
    jest.resetAllMocks();
    mockedSimpleCache.mockClear();
    fetchMock.resetMocks();

    client = new ECA3Client(
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
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: 'refresh_token',
        }),
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
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

  describe('listAccountsSigned', () => {
    it('should call the custodian_listAccountsSigned method on the json rpc caller', async () => {
      await client.listAccountsSigned();
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_listAccountsSigned',
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
      await client.createTransaction(mockECA3CreateTransactionPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_createTransaction',
        mockECA3CreateTransactionPayload,
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
      await client.signPersonalMessage(mockECA3SignPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_sign',
        mockECA3SignPayload,
        'accesstoken',
      );
    });
  });

  describe('signTypedData', () => {
    it('should call the custodian_signTypedData method on the json rpc caller', async () => {
      await client.signTypedData(mockECA3SignTypedDataPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_signTypedData',
        mockECA3SignTypedDataPayload,
        'accesstoken',
      );
    });
  });

  describe('getSignedMessage', () => {
    it('should call the custodian_getSignedMessageById method on the json rpc caller', async () => {
      await client.getSignedMessage(mockECA3GetSignedMessageByIdPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_getSignedMessageById',
        mockECA3GetSignedMessageByIdPayload,
        'accesstoken',
      );
    });
  });

  describe('getTransaction', () => {
    it('should call the custodian_getTransactionById method on the json rpc caller', async () => {
      await client.getTransaction(mockECA3GetTransactionByIdPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_getTransactionById',
        mockECA3GetTransactionByIdPayload,
        'accesstoken',
      );
    });
  });

  describe('getTransactionLink', () => {
    it('should call the custodian_getTransactionLink method on the json rpc caller', async () => {
      await client.getTransactionLink(mockECA3GetTransactionLinkPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_getTransactionLink',
        mockECA3GetTransactionLinkPayload,
        'accesstoken',
      );
    });
  });

  describe('getSignedMessageLink', () => {
    it('should call the custodian_getSignedMessageLink method on the json rpc caller', async () => {
      await client.getSignedMessageLink(mockECA3GetSignedMessageLinkPayload);
      expect(jsonRpcCall).toHaveBeenCalledWith(
        'custodian_getSignedMessageLink',
        mockECA3GetSignedMessageLinkPayload,
        'accesstoken',
      );
    });
  });
});
