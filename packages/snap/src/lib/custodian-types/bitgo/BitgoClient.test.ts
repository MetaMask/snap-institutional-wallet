import fetchMock from 'jest-fetch-mock';

import { BitgoClient } from './BitgoClient';

fetchMock.enableMocks();

describe('BitgoClient', () => {
  let bitgoClient: BitgoClient;

  const mockJwt = 'mock-jwt';
  const mockUrl = 'http://mock-url';

  beforeAll(() => {
    bitgoClient = new BitgoClient(mockUrl, mockJwt);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.resetMocks();
  });

  describe('BitgoClient#getHeaders', () => {
    it('should return headers with the JWT in the authorization field', () => {
      const result = bitgoClient.getHeaders();

      expect(result).toEqual({
        Authorization: `Bearer ${mockJwt}`,
        'Content-Type': 'application/json',
      });
    });
  });

  describe('BitgoClient#getEthereumAccounts', () => {
    it('should GET the /mmi/wallets endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: [] }));

      const result = await bitgoClient.getEthereumAccounts();

      expect(fetchMock).toHaveBeenCalledWith(`${mockUrl}/wallets`, {
        headers: {
          Authorization: `Bearer ${mockJwt}`,
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual([]);
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockResponseOnce(async () =>
        Promise.reject(new Error('Network error')),
      );

      await expect(bitgoClient.getEthereumAccounts()).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('BitgoClient#getEthereumAccountByAddress', () => {
    it('should GET the /mmi/wallets/address/:address endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: ['account'] }));

      const result = await bitgoClient.getEthereumAccountByAddress('0x');

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/mmi/wallets/address/0x`,
        {
          headers: {
            Authorization: `Bearer ${mockJwt}`,
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result).toBe('account');
    });

    it("should return null if the account isn't found", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: [] }));

      const result = await bitgoClient.getEthereumAccountByAddress('0x');

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/mmi/wallets/address/0x`,
        {
          headers: {
            Authorization: `Bearer ${mockJwt}`,
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result).toBeNull();
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockResponseOnce(async () =>
        Promise.reject(new Error('Network error')),
      );

      await expect(
        bitgoClient.getEthereumAccountByAddress('0x'),
      ).rejects.toThrow('Network error');
    });
  });

  describe('BitgoClient#createTransaction', () => {
    it('should POST the /custodian/transaction endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: 'ok' }));

      await bitgoClient.createTransaction(
        { walletId: 'test', coinId: 'gteth' },
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
        `${mockUrl}/mmi/gteth/wallet/test/tx/build`,
        {
          body: '{"txParams":{"to":"test","value":"test","data":"test","gasLimit":"test","gasPrice":"test","from":"test","type":"0"}}',
          headers: {
            Authorization: 'Bearer mock-jwt',
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );
    });

    it('should POST the /custodian/transaction endpoint with EIP-1559 params', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: 'ok' }));

      await bitgoClient.createTransaction(
        { walletId: 'test', coinId: 'gteth' },
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
        `${mockUrl}/mmi/gteth/wallet/test/tx/build`,
        {
          body: '{"txParams":{"to":"test","value":"test","data":"test","gasLimit":"test","maxPriorityFeePerGas":"test","maxFeePerGas":"test","from":"test","type":"2"}}',
          headers: {
            Authorization: 'Bearer mock-jwt',
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockResponseOnce(async () =>
        Promise.reject(new Error('Network error')),
      );

      await expect(
        bitgoClient.createTransaction(
          { walletId: 'test', coinId: 'gteth' },
          {
            to: 'test',
            value: 'test',
            data: 'test',
            gasLimit: 'test',
            gasPrice: 'test',
            from: 'test',
          },
        ),
      ).rejects.toThrow('Network error');
    });
  });

  describe('BitgoClient#getTransactions', () => {
    it('should GET the /custodian/transaction endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: [] }));

      const result = await bitgoClient.getTransactions();

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/custodian/transaction`,
        {
          headers: {
            Authorization: `Bearer ${mockJwt}`,
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result).toEqual([]);
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockResponseOnce(async () =>
        Promise.reject(new Error('Network error')),
      );

      await expect(bitgoClient.getTransactions()).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('BitgoClient#getTransaction', () => {
    it('should GET the /eth/wallets/transactions/:id endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ data: [{}] }));

      const result = await bitgoClient.getTransaction('xxx');

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockUrl}/mmi/wallets/transactions/xxx`,
        {
          headers: {
            Authorization: `Bearer ${mockJwt}`,
            'Content-Type': 'application/json',
          },
        },
      );

      expect(result).toEqual({});
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockResponseOnce(async () =>
        Promise.reject(new Error('Network error')),
      );

      await expect(bitgoClient.getTransaction('xxx')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('BitgoClient#getCustomerProof', () => {
    it('should POST the /custodian/customer-proof endpoint', async () => {
      fetchMock.mockResponseOnce(JSON.stringify('ok'));

      const result = await bitgoClient.getCustomerProof();
      expect(result).toBe('ok');

      expect(fetchMock).toHaveBeenCalledWith(`${mockUrl}/mmi/customer-proof`, {
        body: '{"version":"n/a"}',
        headers: {
          Authorization: 'Bearer mock-jwt',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
    });

    it('should fail if an exception is thrown by the HTTP client', async () => {
      fetchMock.mockResponseOnce(async () =>
        Promise.reject(new Error('Network error')),
      );

      await expect(bitgoClient.getCustomerProof()).rejects.toThrow(
        'Network error',
      );
    });
  });
});
