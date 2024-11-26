import { AuthTypes } from '@metamask-institutional/types';
import type { ITransactionDetails } from '@metamask-institutional/types';
import { mocked } from 'ts-jest/utils';

import { BitgoClient } from './BitgoClient';
import { BitgoCustodianApi } from './BitgoCustodianApi';
import { bitgoMockEip712Response } from './mocks/bitgoEip712Mock';
import { bitgoGetAccountsMock } from './mocks/bitgoGetAccountsMock';
import { bitgoGetCustomerProofMock } from './mocks/bitgoGetCustomerProofMock';
import { bitgoMockPersonalSignResponse } from './mocks/bitgoPersonalSignMock';
import { bitgoTransactionMock } from './mocks/bitgoTransactionMock';
import type {
  MessageTypes,
  TypedMessage,
} from '../../interfaces/ITypedMessage';

jest.mock('./BitgoClient');

describe('BitgoCustodianApi', () => {
  let bitgoCustodianApi: BitgoCustodianApi;
  const mockedBitgoClient = mocked(BitgoClient, true);
  let mockedBitgoClientInstance;

  const mockJwt = 'mock-jwt';
  const mockUrl = 'http://mock-url';

  beforeEach(() => {
    bitgoCustodianApi = new BitgoCustodianApi(
      { jwt: mockJwt },
      AuthTypes.TOKEN,
      mockUrl,
      0,
    );

    mockedBitgoClientInstance = mockedBitgoClient.mock.instances[0];
    jest
      .spyOn(mockedBitgoClientInstance, 'getEthereumAccounts')
      .mockImplementation()
      .mockImplementation(() => bitgoGetAccountsMock.data);

    jest
      .spyOn(mockedBitgoClientInstance, 'getTransactions')
      .mockImplementation()
      .mockImplementation(() => [bitgoTransactionMock]);

    jest
      .spyOn(mockedBitgoClientInstance, 'getTransaction')
      .mockImplementation()
      .mockImplementation(() => bitgoTransactionMock);

    jest
      .spyOn(mockedBitgoClientInstance, 'createTransaction')
      .mockImplementation()
      .mockImplementation(() => bitgoTransactionMock);

    jest
      .spyOn(mockedBitgoClientInstance, 'getCustomerProof')
      .mockImplementation()
      .mockImplementation(() => bitgoGetCustomerProofMock);

    jest
      .spyOn(mockedBitgoClientInstance, 'getEthereumAccountByAddress')
      .mockImplementation()
      .mockImplementation(() => bitgoGetAccountsMock.data[0]);

    jest
      .spyOn(mockedBitgoClientInstance, 'signPersonalMessage')
      .mockImplementation()
      .mockImplementation(() => bitgoMockPersonalSignResponse);

    jest
      .spyOn(mockedBitgoClientInstance, 'signTypedData_v4')
      .mockImplementation()
      .mockImplementation(() => bitgoMockEip712Response);

    mockedBitgoClient.mockClear();
  });

  describe('BitgoCustodianApi#getAccountHierarchy', () => {
    it('does nothing', async () => {
      const result = await bitgoCustodianApi.getAccountHierarchy();

      expect(result).toBeNull();
    });
  });

  describe('BitgoCustodianApi#getEthereumAccounts', () => {
    it('returns the accounts', async () => {
      const result = await bitgoCustodianApi.getEthereumAccounts();
      expect(mockedBitgoClientInstance.getEthereumAccounts).toHaveBeenCalled();

      expect(result).toEqual(
        bitgoGetAccountsMock.data.map((account) => ({
          name:
            account.labels.find((label) => label.key === 'Wallet Name')
              ?.value || 'Unnamed Bitgo Wallet',
          address: account.address,
          balance: account.balance,
          custodianDetails: {
            accountId: account.custodianDetails.id,
            coinId: 'gteth',
          },
          chainId: account.chainId,
          labels: account.labels.filter((label) => label.key !== 'Wallet Name'),
        })),
      );
    });

    it('filters by chainId', async () => {
      const result = await bitgoCustodianApi.getEthereumAccounts(999);
      expect(mockedBitgoClientInstance.getEthereumAccounts).toHaveBeenCalled();

      expect(result).toEqual([]);
    });
  });

  describe('BitgoCustodianApi#getEthereumAccountsByAddress', () => {
    it('fetches the ethereum accounts for a given address', async () => {
      const result = await bitgoCustodianApi.getEthereumAccountsByAddress(
        '0xed',
      );

      expect(result).toHaveLength(
        bitgoGetAccountsMock.data.filter((acc) =>
          acc.address.startsWith('0xed'),
        ).length,
      );
    });
  });

  describe('BitgoCustodianApi#getEthereumAccountsByLabelOrAddressName', () => {
    it('fetches the ethereum accounts based on label or address name', async () => {
      const result =
        await bitgoCustodianApi.getEthereumAccountsByLabelOrAddressName(
          'MMI Alpha test 1',
        );

      expect(result).toHaveLength(
        bitgoGetAccountsMock.data.filter((acc) =>
          acc.labels[0].value.includes('MMI Alpha test 1'),
        ).length,
      );
    });
  });

  describe('BitgoCustodianApi#createTransaction', () => {
    it('finds the account, then calls client.createTransaction', async () => {
      const fromAddress = bitgoGetAccountsMock.data[0].address;
      const txParams = {
        from: fromAddress,
        to: 'to',
        value: '1',
        gasPrice: '1',
        gasLimit: '1', // No data
      };

      await bitgoCustodianApi.createTransaction(txParams);

      expect(mockedBitgoClientInstance.getEthereumAccounts).toHaveBeenCalled();

      expect(mockedBitgoClientInstance.createTransaction).toHaveBeenCalledWith(
        {
          walletId: bitgoGetAccountsMock.data[0].custodianDetails.id,
          coinId: 'gteth',
        },
        txParams,
      );
    });

    it('throws if the ethereum account does not exist when we search by wallet', async () => {
      jest
        .spyOn(mockedBitgoClientInstance, 'getEthereumAccounts')
        .mockImplementation()
        .mockImplementationOnce(() => []);

      const fromAddress = bitgoGetAccountsMock.data[0].address;
      const txParams = {
        from: fromAddress,
        to: 'to',
        value: '1',
        gasPrice: '1',
        gasLimit: '1', // No data
      };

      expect(
        bitgoCustodianApi.createTransaction({
          ...txParams,
          from: 'does-not-exist1',
        }),
      ).rejects.toThrow('No such ethereum account');
    });
  });

  describe('BitgoCustodianApi#getTransaction', () => {
    it('gets all the transactions and filters them', async () => {
      const result: ITransactionDetails =
        await bitgoCustodianApi.getTransaction(
          '0x',
          bitgoTransactionMock.custodianTransactionId,
        );

      expect(result).toEqual({
        transactionHash: bitgoTransactionMock.transactionHash,
        transactionStatus: bitgoTransactionMock.transactionStatus,
        custodian_transactionId: bitgoTransactionMock.custodianTransactionId,
        from: bitgoTransactionMock.from,
        gasPrice: bitgoTransactionMock.gasPrice,
        gasLimit: bitgoTransactionMock.gasLimit,
        nonce: bitgoTransactionMock.nonce,
        maxFeePerGas: bitgoTransactionMock.maxFeePerGas,
        maxPriorityFeePerGas: bitgoTransactionMock.maxPriorityFeePerGas,
      });

      expect(mockedBitgoClientInstance.getTransaction).toHaveBeenCalledWith(
        bitgoTransactionMock.custodianTransactionId,
      );
    });
  });

  describe('BitgoCustodianApi#getCustomerId', () => {
    it('should call getOrganizations and return the id of the first organization that is returned', async () => {
      const result = await bitgoCustodianApi.getCustomerId();
      expect(result).toBe('bitgo-customer');
    });
  });

  describe('BitgoCustodianApi#getAllTransactions', () => {
    it('should call getTransactions for the customer corresponding to the first organization', async () => {
      await bitgoCustodianApi.getAllTransactions();
      expect(mockedBitgoClientInstance.getTransactions).toHaveBeenCalled();
    });
  });

  describe('BitgoCustodianApi#signPersonalMessage', () => {
    it('calls signPersonalMessage on the client', async () => {
      const buffer = '0xdeadbeef';
      const fromAddress = bitgoGetAccountsMock.data[0].address;

      const result = await bitgoCustodianApi.signPersonalMessage(
        fromAddress,
        buffer,
      );

      expect(result).toEqual({
        from: fromAddress,
        transactionStatus: 'created',
        custodian_transactionId: bitgoMockPersonalSignResponse.data.id,
      });

      expect(
        mockedBitgoClientInstance.signPersonalMessage,
      ).toHaveBeenCalledWith(
        bitgoGetAccountsMock.data[0].address,
        buffer,
        bitgoGetAccountsMock.data[0].custodianDetails.coin,
        bitgoGetAccountsMock.data[0].custodianDetails.id,
      );
    });
  });

  describe('BitgoCustodianApi#signTypedData_v4', () => {
    it('calls client.signTypedData_v4', async () => {
      const fromAddress = bitgoGetAccountsMock.data[0].address;

      const buffer: TypedMessage<MessageTypes> = {
        types: {
          EIP712Domain: [],
        },
        primaryType: 'test',
        domain: {
          chainId: 4,
          name: 'test',
        },
        message: {},
      };

      const result = await bitgoCustodianApi.signTypedData_v4(
        fromAddress,
        buffer,
        'V4',
      );

      expect(result).toEqual({
        from: fromAddress,
        transactionStatus: 'created',
        custodian_transactionId: bitgoMockEip712Response.data.id,
      });

      expect(mockedBitgoClientInstance.signTypedData_v4).toHaveBeenCalledWith(
        fromAddress,
        buffer,
        bitgoGetAccountsMock.data[0].custodianDetails.coin,
        bitgoGetAccountsMock.data[0].custodianDetails.id,
        'V4',
      );
    });
  });

  describe('BitgoCustodianApi#getCustomerProof', () => {
    it('calls getCustomerProof on the client and returns the token', async () => {
      const result = await bitgoCustodianApi.getCustomerProof();

      expect(result).toEqual(bitgoGetCustomerProofMock.data);

      expect(mockedBitgoClientInstance.getCustomerProof).toHaveBeenCalled();
    });
  });

  describe('BitgoCustodianApi#getErc20Tokens', () => {
    it('returns an empty object', async () => {
      const result = await bitgoCustodianApi.getErc20Tokens();

      expect(result).toEqual({});
    });
  });

  describe('BitgoCustodianApi#getTransactionLink', () => {
    it('resolves to null', async () => {
      const result = await bitgoCustodianApi.getTransactionLink('xxx');

      expect(result).toBeNull();
    });
  });

  describe('BitgoCustodianApi#getSupportedChains', () => {
    it('calls getEthereumAccounts on the client and returns the chainId for that specific account', async () => {
      const result = await bitgoCustodianApi.getSupportedChains('0x');

      expect(
        mockedBitgoClientInstance.getEthereumAccountByAddress,
      ).toHaveBeenCalledWith('0x');

      expect(result).toEqual([bitgoGetAccountsMock.data[0].chainId.toString()]);
    });

    it('should return null if the account isnt found', async () => {
      jest
        .spyOn(mockedBitgoClientInstance, 'getEthereumAccountByAddress')
        .mockImplementation()
        .mockImplementationOnce(() => null);

      const result = await bitgoCustodianApi.getSupportedChains('0x');

      expect(result).toEqual([]);
    });
  });
});
