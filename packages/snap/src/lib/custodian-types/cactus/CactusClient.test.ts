import type { MessageTypes } from '@metamask/eth-sig-util';
import fetchMock from 'jest-fetch-mock';

import { CactusClient } from './CactusClient';
import { mockCactusGetChainIdsResponse } from './mocks/mockCactusGetChainIdsResponse';
import type { TypedMessage } from '../../types/ITypedMessage';

fetchMock.enableMocks();

describe('CactusClient', () => {
  let cactusClient: CactusClient;

  const mockRefreshToken = 'mock-refresh-token';
  const mockUrl = 'http://mock-url';

  beforeAll(() => {
    cactusClient = new CactusClient(mockUrl, mockRefreshToken);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.resetMocks();
  });

  describe('getAccessToken', () => {
    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockImplementationOnce(async () =>
        Promise.reject(new Error('Network failure')),
      );

      await expect(cactusClient.getAccessToken()).rejects.toThrow(
        'Network failure',
      );
    });

    it('should fail if no access token is returned', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({}));
      await expect(cactusClient.getAccessToken()).rejects.toThrow(
        'No access token',
      );
    });

    it('should call the Cactus API and get an access token', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          jwt: '123',
        }),
      );

      const result = await cactusClient.getAccessToken();

      expect(result).toBe('123');

      expect(fetchMock).toHaveBeenCalledWith(`${mockUrl}/tokens`, {
        body: '{"grantType":"refresh_token","refreshToken":"mock-refresh-token"}',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('CactusClient#getEthereumAccounts', () => {
    it('should GET the /eth-accounts endpoint', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          jwt: '123',
        }),
      );

      fetchMock.mockResponseOnce(JSON.stringify([]));

      const result = await cactusClient.getEthereumAccounts();

      expect(fetchMock).toHaveBeenCalledWith(`${mockUrl}/eth-accounts`, {
        headers: {
          Authorization: `Bearer 123`,
          'Content-Type': 'application/json',
        },
      });

      expect(result).toStrictEqual([]);
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockReject(new Error('Failed to fetch accounts'));
      await expect(cactusClient.getEthereumAccounts()).rejects.toThrow(
        'Failed to fetch accounts',
      );
    });
  });

  describe('CactusClient#createTransaction', () => {
    it('should POST the transactions endpoint', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          access_token: '123',
        }),
      );

      fetchMock.mockResponseOnce(JSON.stringify('ok'));

      await cactusClient.createTransaction(
        { chainId: 4, note: 'hello' },
        {
          to: 'test',
          value: 'test',
          data: 'test',
          gasLimit: 'test',
          gasPrice: 'test',
          from: 'test',
          type: '0',
        },
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/transactions?chainId=4`,
        {
          body: '{"to":"test","from":"test","value":"test","data":"test","gasLimit":"test","note":"hello","gasPrice":"test"}',
          headers: {
            Authorization: 'Bearer 123',
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );
    });

    it('should POST the /custodian/transaction endpoint with EIP-1559 params', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          access_token: '123',
        }),
      );

      fetchMock.mockResponseOnce(JSON.stringify('ok'));

      await cactusClient.createTransaction(
        { chainId: 4, note: 'Hello' },
        {
          to: 'test',
          value: 'test',
          data: 'test',
          gasLimit: 'test',
          maxPriorityFeePerGas: 'test',
          maxFeePerGas: 'test',
          from: 'test',
          type: '2',
        },
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/transactions?chainId=4`,
        {
          body: '{"to":"test","from":"test","value":"test","data":"test","gasLimit":"test","note":"Hello","maxPriorityFeePerGas":"test","maxFeePerGas":"test"}',
          headers: {
            Authorization: 'Bearer 123',
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockReject(new Error('Transaction failed'));
      await expect(
        cactusClient.createTransaction(
          { chainId: 4, note: 'test' },
          {
            to: 'test',
            value: 'test',
            data: 'test',
            gasLimit: 'test',
            gasPrice: 'test',
            from: 'test',
          },
        ),
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('CactusClient#getSignedMessage', () => {
    it('should GET the /custodian/signatures endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([{}]));

      const result = await cactusClient.getSignedMessage('xxx');

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/signatures?transactionId=xxx`,
        {
          headers: {
            Authorization: `Bearer 123`,
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result).toStrictEqual({});
    });

    it('should return null if the signature does not exist', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([]));

      const result = await cactusClient.getSignedMessage('xxx');

      expect(result).toBeNull();
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockReject(new Error('Failed to get signature'));
      await expect(cactusClient.getSignedMessage('xxx')).rejects.toThrow(
        'Failed to get signature',
      );
    });

    it('should handle this reference response from the cactus API', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify([
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '11155111',
            nonce: null,
            from: '0xa46f26c8249a9be0c13371b331b086eb3bbf0f80',
            signature:
              '0x6b85a1980b72de7cb720683d2a6e4fed237ec24f8145aa062762831f6ff30f0124af5b15548ab1f4c729cf813bc0121dbda4dd5ec50a2cc8f84445a19520447f1b',
            transactionStatus: 'signed',
            transactionHash: null,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            custodian_transactionId: 'AYN2R2S09QD110110000892',
            gasPrice: null,
            maxFeePerGas: null,
            maxPriorityFeePerGas: null,
            gasLimit: null,
          },
        ]),
      );

      const result = await cactusClient.getTransactions(4);

      expect(result).toStrictEqual([
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '11155111',
          nonce: null,
          from: '0xa46f26c8249a9be0c13371b331b086eb3bbf0f80',
          signature:
            '0x6b85a1980b72de7cb720683d2a6e4fed237ec24f8145aa062762831f6ff30f0124af5b15548ab1f4c729cf813bc0121dbda4dd5ec50a2cc8f84445a19520447f1b',
          transactionStatus: 'signed',
          transactionHash: null,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          custodian_transactionId: 'AYN2R2S09QD110110000892',
          gasPrice: null,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasLimit: null,
        },
      ]);
    });
  });

  describe('CactusClient#getTransactions', () => {
    it('should GET the /transactions endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([]));

      const result = await cactusClient.getTransactions(4);

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/transactions?chainId=4`,
        {
          headers: {
            Authorization: `Bearer 123`,
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result).toStrictEqual([]);
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockImplementationOnce(async () =>
        Promise.reject(new Error('Network failure')),
      );

      await expect(cactusClient.getTransactions(4)).rejects.toThrow(
        'Network failure',
      );
    });
  });

  describe('CactusClient#getTransaction', () => {
    it('should GET the /custodian/transactions endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([{}]));

      const result = await cactusClient.getTransaction('xxx');

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/transactions?transactionId=xxx`,
        {
          headers: {
            Authorization: `Bearer 123`,
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result).toStrictEqual({});
    });

    it('should return null if the transaction does not exist', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([]));

      const result = await cactusClient.getTransaction('xxx');

      expect(result).toBeNull();
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockImplementationOnce(async () =>
        Promise.reject(new Error('Network failure')),
      );

      await expect(cactusClient.getTransactions(4)).rejects.toThrow(
        'Network failure',
      );
    });
  });

  describe('CactusClient#getCustomerProof', () => {
    it('should POST the /custodian/customer-proof endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify('ok'));

      const result = await cactusClient.getCustomerProof();
      expect(result).toBe('ok');

      expect(fetchMock).toHaveBeenCalledWith(`${mockUrl}/customer-proof`, {
        body: '{}',
        headers: {
          Authorization: 'Bearer 123',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockImplementationOnce(async () =>
        Promise.reject(new Error('Network failure')),
      );

      await expect(cactusClient.getCustomerProof()).rejects.toThrow(
        'Network failure',
      );
    });
  });

  describe('CactusClient#signTypedData_v4', () => {
    it('should POST the /signatures endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify('ok'));

      const buffer: TypedMessage<MessageTypes> = {
        types: {
          EIP712Domain: [],
        },
        primaryType: 'test',
        domain: {
          name: 'test',
        },
        message: {},
      };

      await cactusClient.signTypedData_v4('test', buffer, 'V4', 4);

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/signatures?chainId=4`,
        {
          body: '{"address":"test","payload":{"types":{"EIP712Domain":[]},"primaryType":"test","domain":{"name":"test"},"message":{}},"signatureVersion":"V4"}',
          headers: {
            Authorization: 'Bearer 123',
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );
    });

    it('should not include a chainId in the URL if none is passed', async () => {
      fetchMock.mockResponseOnce(JSON.stringify('ok'));

      const buffer: TypedMessage<MessageTypes> = {
        types: {
          EIP712Domain: [],
        },
        primaryType: 'test',
        domain: {
          name: 'test',
        },
        message: {},
      };

      await cactusClient.signTypedData_v4('test', buffer, 'V4');

      expect(fetchMock).toHaveBeenCalledWith(`${mockUrl}/signatures`, {
        body: '{"address":"test","payload":{"types":{"EIP712Domain":[]},"primaryType":"test","domain":{"name":"test"},"message":{}},"signatureVersion":"V4"}',
        headers: {
          Authorization: 'Bearer 123',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockImplementationOnce(async () =>
        Promise.reject(new Error('Network failure')),
      );

      const buffer: TypedMessage<MessageTypes> = {
        types: {
          EIP712Domain: [],
        },
        primaryType: 'test',
        domain: {
          name: 'test',
        },
        message: {},
      };

      await expect(
        cactusClient.signTypedData_v4('test', buffer, 'V4', 4),
      ).rejects.toThrow('Network failure');
    });
  });

  describe('CactusClient#signPersonalMessage', () => {
    it('should POST the /signatures endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify('ok'));

      const message = '0xdeadbeef';

      await cactusClient.signPersonalMessage('test', message);

      expect(fetchMock).toHaveBeenCalledWith(`${mockUrl}/signatures`, {
        body: '{"address":"test","payload":{"message":"0xdeadbeef"},"signatureVersion":"personalSign"}',
        headers: {
          Authorization: 'Bearer 123',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockImplementationOnce(async () =>
        Promise.reject(new Error('Network failure')),
      );

      const message = '0xdeadbeef';

      await expect(
        cactusClient.signPersonalMessage('test', message),
      ).rejects.toThrow('Network failure');
    });
  });

  describe('getChainIds', () => {
    it('should call the cactus /chainIds endpoint', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ mockCactusGetChainIdsResponse }),
      );

      await cactusClient.getChainIds();

      expect(fetchMock).toHaveBeenCalledWith(`${mockUrl}/chainIds`, {
        headers: {
          Authorization: 'Bearer 123',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockImplementationOnce(async () =>
        Promise.reject(new Error('Network error')),
      );

      await expect(cactusClient.getChainIds()).rejects.toThrow('Network error');
    });
  });
});
