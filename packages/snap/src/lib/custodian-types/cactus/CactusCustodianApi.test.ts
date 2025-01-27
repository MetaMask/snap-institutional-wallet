/* eslint-disable @typescript-eslint/unbound-method */
import { CactusClient } from './CactusClient';
import { CactusCustodianApi } from './CactusCustodianApi';
import type { ICactusEthereumAccount } from './interfaces/ICactusEthereumAccount';
import type { ICactusTransaction } from './interfaces/ICactusTransaction';
import { mockCactusCreateSignatureResponse } from './mocks/mockCactusCreateSignatureResponse';
import { mockCactusCreateTransactionResult } from './mocks/mockCactusCreateTransactionResult';
import { mockCactusGetChainIdsResponse } from './mocks/mockCactusGetChainIdsResponse';
import { mockCactusGetCustomerProofResponse } from './mocks/mockCactusGetCustomerProofResponse';
import { mockCactusGetEthereumAccountsResponse } from './mocks/mockCactusGetEthereumAccountsResponse';
import { mockCactusGetSignedMessageResponse } from './mocks/mockCactusGetSignedMessageResponse';
import { mockCactusGetTransactionsResult } from './mocks/mockCactusGetTransactionsResult';
import { mapTransactionStatus } from '../../../util/map-status';
import type {
  SignedMessageDetails,
  TransactionDetails,
} from '../../structs/CustodialKeyringStructs';
import type { MessageTypes, TypedMessage } from '../../types/ITypedMessage';

jest.mock('./CactusClient');

describe('CactusCustodianApi', () => {
  let cactusCustodianApi: CactusCustodianApi;
  const mockedCactusClient = jest.mocked(CactusClient, { shallow: false });
  let mockedCactusClientInstance: CactusClient;

  const mockRefreshToken = 'mockRefreshToken';
  const mockUrl = 'http://mock-url';

  const firstTransaction =
    mockCactusGetTransactionsResult[0] as ICactusTransaction;
  const firstAccount =
    mockCactusGetEthereumAccountsResponse[0] as ICactusEthereumAccount;

  beforeEach(() => {
    cactusCustodianApi = new CactusCustodianApi(
      { refreshToken: mockRefreshToken, refreshTokenUrl: mockUrl },
      mockUrl,
      0,
    );

    mockedCactusClientInstance = mockedCactusClient.mock
      .instances[0] as CactusClient;
    jest
      .spyOn(mockedCactusClientInstance, 'getEthereumAccounts')
      .mockImplementation(async () =>
        Promise.resolve(mockCactusGetEthereumAccountsResponse),
      );

    jest
      .spyOn(mockedCactusClientInstance, 'getTransaction')
      .mockImplementation()
      .mockImplementation(async () => firstTransaction);

    jest
      .spyOn(mockedCactusClientInstance, 'createTransaction')
      .mockImplementation(async () =>
        Promise.resolve(mockCactusCreateTransactionResult),
      );

    jest
      .spyOn(mockedCactusClientInstance, 'getCustomerProof')
      .mockImplementation(async () =>
        Promise.resolve(mockCactusGetCustomerProofResponse),
      );

    jest
      .spyOn(mockedCactusClientInstance, 'signTypedData_v4')
      .mockImplementation(async () =>
        Promise.resolve(mockCactusCreateSignatureResponse),
      );

    jest
      .spyOn(mockedCactusClientInstance, 'signPersonalMessage')
      .mockImplementation(async () =>
        Promise.resolve(mockCactusCreateSignatureResponse),
      );

    jest
      .spyOn(mockedCactusClientInstance, 'getChainIds')
      .mockImplementation(async () =>
        Promise.resolve(mockCactusGetChainIdsResponse),
      );

    jest
      .spyOn(mockedCactusClientInstance, 'getSignedMessage')
      .mockImplementation(async () =>
        Promise.resolve(mockCactusGetSignedMessageResponse),
      );

    mockedCactusClient.mockClear();
  });

  describe('CactusCustodianApi#getEthereumAccounts', () => {
    it('returns the accounts', async () => {
      const result = await cactusCustodianApi.getEthereumAccounts();
      expect(mockedCactusClientInstance.getEthereumAccounts).toHaveBeenCalled();

      expect(result).toStrictEqual(
        mockCactusGetEthereumAccountsResponse.map((account) => ({
          name: account.name || 'Cactus wallet',
          address: account.address,
          balance: account.balance,
          custodianDetails: {
            walletId: account.custodianDetails.walletId,
            chainId: account.chainId,
          },
          labels: account.labels
            ? account.labels.map((label) => ({ key: 'label', value: label }))
            : [],
        })),
      );
    });
  });

  describe('CactusCustodianApi#getEthereumAccountsByAddress', () => {
    it('fetches the ethereum accounts for a given address', async () => {
      const result = await cactusCustodianApi.getEthereumAccountsByAddress(
        '0xB',
      );

      expect(result).toHaveLength(
        mockCactusGetEthereumAccountsResponse.filter((acc) =>
          acc.address.startsWith('0xB'),
        ).length,
      );
    });
  });

  describe('CactusCustodianApi#getEthereumAccountsByLabelOrAddressName', () => {
    it('fetches the ethereum accounts based on label or address name', async () => {
      const result =
        await cactusCustodianApi.getEthereumAccountsByLabelOrAddressName(
          'test-label',
        );

      expect(result).toHaveLength(
        mockCactusGetEthereumAccountsResponse.filter((acc) =>
          acc.name.includes('test-label'),
        ).length,
      );
    });

    it('returns them all if there is no name filter', async () => {
      const result =
        await cactusCustodianApi.getEthereumAccountsByLabelOrAddressName('');

      expect(result).toHaveLength(mockCactusGetEthereumAccountsResponse.length);
    });
  });

  describe('CactusCustodianApi#createTransaction', () => {
    it('finds the account, then calls client.createTransaction', async () => {
      const fromAddress = firstAccount.address;
      const txParams = {
        from: fromAddress,
        to: 'to',
        value: '1',
        gasPrice: '1',
        gasLimit: '1', // No data
        note: 'note',
      };

      await cactusCustodianApi.createTransaction(txParams, {
        chainId: '4',
        custodianPublishesTransaction: true,
      });

      expect(mockedCactusClientInstance.createTransaction).toHaveBeenCalledWith(
        {
          chainId: 4,
          note: '',
        },
        txParams,
      );
    });
  });

  describe('CactusCustodianApi#getTransaction', () => {
    it('gets a single transaction by id', async () => {
      const result: TransactionDetails =
        (await cactusCustodianApi.getTransaction(
          '0x',
          firstTransaction.custodian_transactionId,
        )) as TransactionDetails;

      expect(result).toStrictEqual({
        transactionHash: firstTransaction.transactionHash,
        transactionStatus: mapTransactionStatus(
          firstTransaction.transactionStatus,
        ),
        custodianPublishesTransaction: true,
        custodianTransactionId: firstTransaction.custodian_transactionId,
        from: firstTransaction.from,
        gasPrice: firstTransaction.gasPrice,
        gasLimit: firstTransaction.gasLimit,
        nonce: firstTransaction.nonce,
        maxFeePerGas: firstTransaction.maxFeePerGas,
        maxPriorityFeePerGas: firstTransaction.maxPriorityFeePerGas,
      });

      expect(mockedCactusClientInstance.getTransaction).toHaveBeenCalledWith(
        firstTransaction.custodian_transactionId,
      );
    });

    it('returns null if the client returns null', async () => {
      jest
        .spyOn(mockedCactusClientInstance, 'getTransaction')
        .mockImplementation()
        .mockResolvedValueOnce(null);

      const result: TransactionDetails =
        (await cactusCustodianApi.getTransaction(
          '0x',
          firstTransaction.custodian_transactionId,
        )) as TransactionDetails;

      expect(result).toBeNull();
    });
  });

  describe('CactusCustodianApi#signPersonalMessage', () => {
    it('throws an error', async () => {
      const buffer = '0xdeadbeef';
      const fromAddress = firstAccount.address;

      const result = await cactusCustodianApi.signPersonalMessage(
        fromAddress,
        buffer,
      );

      expect(result).toStrictEqual({
        from: fromAddress,
        status: mapTransactionStatus(
          mockCactusCreateSignatureResponse.transactionStatus,
        ),
        signature: null,
        id: mockCactusCreateSignatureResponse.custodian_transactionId,
      });

      expect(
        mockedCactusClientInstance.signPersonalMessage,
      ).toHaveBeenCalledWith(firstAccount.address, buffer);
    });
  });

  describe('CactusCustodianApi#signTypedData_v4', () => {
    it('calls client.signTypedData_v4', async () => {
      const fromAddress = firstAccount.address;

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

      const result = await cactusCustodianApi.signTypedData_v4(
        fromAddress,
        buffer,
        'V4',
      );

      expect(result).toStrictEqual({
        id: mockCactusCreateSignatureResponse.custodian_transactionId,
        signature: null,
        from: fromAddress,
        status: mapTransactionStatus(
          mockCactusCreateSignatureResponse.transactionStatus,
        ),
      });

      expect(mockedCactusClientInstance.signTypedData_v4).toHaveBeenCalledWith(
        firstAccount.address,
        buffer,
        'V4',
        4,
      );
    });
  });

  describe('CactusCustodianApi#getCustomerProof', () => {
    it('calls getCustomerProof on the client and returns the token', async () => {
      const result = await cactusCustodianApi.getCustomerProof();

      expect(result).toStrictEqual(mockCactusGetCustomerProofResponse.jwt);

      expect(mockedCactusClientInstance.getCustomerProof).toHaveBeenCalled();
    });
  });

  describe('CactusCustodianApi#getErc20Tokens', () => {
    it('returns an empty object', async () => {
      const result = await cactusCustodianApi.getErc20Tokens();

      expect(result).toStrictEqual({});
    });
  });

  describe('CactusCustodianApi#getTransactionLink', () => {
    it('resolves to null', async () => {
      const result = await cactusCustodianApi.getTransactionLink('xxx');

      expect(result).toBeNull();
    });
  });

  describe('CactusCustodianApi#getSupportedChains', () => {
    it('calls the client and returns the networks as strings', async () => {
      const result = await cactusCustodianApi.getSupportedChains();

      expect(mockedCactusClientInstance.getChainIds).toHaveBeenCalled();

      expect(result).toStrictEqual(['42', '97', '80001', '10001']);
    });
  });

  describe('CactusCustodianApi#getSignedMessage', () => {
    it('gets a single SignedMessage by id', async () => {
      const result = await cactusCustodianApi.getSignedMessage(
        '0x',
        mockCactusGetSignedMessageResponse.custodian_transactionId,
      );

      expect(result).toStrictEqual({
        from: '0x',
        id: mockCactusGetSignedMessageResponse.custodian_transactionId,
        signature: mockCactusGetSignedMessageResponse.signature,
        status: mapTransactionStatus(
          mockCactusGetSignedMessageResponse.transactionStatus,
        ),
      });

      expect(mockedCactusClientInstance.getSignedMessage).toHaveBeenCalledWith(
        mockCactusGetSignedMessageResponse.custodian_transactionId,
      );
    });

    it('returns null if the client returns null', async () => {
      jest
        .spyOn(mockedCactusClientInstance, 'getSignedMessage')
        .mockImplementation()
        .mockResolvedValueOnce(null);

      const result: SignedMessageDetails =
        (await cactusCustodianApi.getSignedMessage(
          '0x',
          mockCactusGetSignedMessageResponse.custodian_transactionId,
        )) as SignedMessageDetails;

      expect(result).toBeNull();
    });
  });
});
