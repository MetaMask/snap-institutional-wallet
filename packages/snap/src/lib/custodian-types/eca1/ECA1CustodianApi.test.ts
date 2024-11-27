/* eslint-disable @typescript-eslint/unbound-method */
import { ECA1Client } from './ECA1Client';
import { ECA1CustodianApi } from './ECA1CustodianApi';
import { mockECA1CreateTransactionResponse } from './mocks/mockECA1CreateTransactionResponse';
import { mockECA1GetCustomerProofResponse } from './mocks/mockECA1GetCustomerProofResponse';
import { mockECA1GetTransactionByIdPayload } from './mocks/mockECA1GetTransactionByIdPayload';
import { mockECA1GetTransactionByIdResponse } from './mocks/mockECA1GetTransactionByIdResponse';
import { mockECA1GetTransactionLinkPayload } from './mocks/mockECA1GetTransactionLinkPayload';
import { mockECA1GetTransactionLinkResponse } from './mocks/mockECA1GetTransactionLinkResponse';
import { mockECA1ListAccountChainIdsResponse } from './mocks/mockECA1ListAccountChainIdsResponse';
import { mockECA1ListAccountResponse } from './mocks/mockECA1ListAccountResponse';
import { mockECA1SignPayload } from './mocks/mockECA1SignPayload';
import { mockECA1SignResponse } from './mocks/mockECA1SignResponse';
import { mockECA1SignTypedDataPayload } from './mocks/mockECA1SignTypedDataPayload';
import { mockECA1SignTypedDataResponse } from './mocks/mockECA1SignTypedDataResponse';
import { hexlify } from '../../../util/hexlify';
import { mapStatusObjectToStatusText } from '../../../util/mapStatusObjectToStatusText';
import type { IEIP1559TxParams, ILegacyTXParams } from '../../types';

jest.mock('./ECA1Client');

describe('ECA1CustodianApi', () => {
  let eca1CustodianApi: ECA1CustodianApi;
  const mockedEca1Client = jest.mocked(ECA1Client, { shallow: true });
  let mockedEca1ClientInstance: ECA1Client;

  const mockJwt = 'mock-jwt';
  const mockUrl = 'http://mock-url';
  const mockRefreshTokenUrl = 'http://mock-refresh-token-url';

  const fromAddress = mockECA1ListAccountResponse.result[0]!.address;

  beforeEach(() => {
    eca1CustodianApi = new ECA1CustodianApi(
      { refreshToken: mockJwt, refreshTokenUrl: mockRefreshTokenUrl },
      mockUrl,
      0,
    );

    mockedEca1ClientInstance = mockedEca1Client.mock.instances[0] as ECA1Client;
    jest
      .spyOn(mockedEca1ClientInstance, 'listAccounts')
      .mockImplementation(async () =>
        Promise.resolve(mockECA1ListAccountResponse),
      );

    jest
      .spyOn(mockedEca1ClientInstance, 'createTransaction')
      .mockImplementation(async () =>
        Promise.resolve(mockECA1CreateTransactionResponse),
      );

    jest
      .spyOn(mockedEca1ClientInstance, 'getTransaction')
      .mockImplementation(async () =>
        Promise.resolve(mockECA1GetTransactionByIdResponse),
      );

    jest
      .spyOn(mockedEca1ClientInstance, 'getTransactionLink')
      .mockImplementation(async () =>
        Promise.resolve(mockECA1GetTransactionLinkResponse),
      );

    jest
      .spyOn(mockedEca1ClientInstance, 'getCustomerProof')
      .mockImplementation(async () =>
        Promise.resolve(mockECA1GetCustomerProofResponse),
      );

    jest
      .spyOn(mockedEca1ClientInstance, 'signTypedData')
      .mockImplementation(async () =>
        Promise.resolve(mockECA1SignTypedDataResponse),
      );

    jest
      .spyOn(mockedEca1ClientInstance, 'signPersonalMessage')
      .mockImplementation(async () => Promise.resolve(mockECA1SignResponse));

    jest
      .spyOn(mockedEca1ClientInstance, 'getAccountChainIds')
      .mockImplementation(async () =>
        Promise.resolve(mockECA1ListAccountChainIdsResponse),
      );

    jest
      .spyOn(mockedEca1ClientInstance, 'getAccountChainIds')
      .mockImplementation(async () =>
        Promise.resolve(mockECA1ListAccountChainIdsResponse),
      );

    mockedEca1Client.mockClear();
  });

  describe('getEthereumAccounts', () => {
    it('returns the accounts', async () => {
      const result = await eca1CustodianApi.getEthereumAccounts();
      expect(mockedEca1ClientInstance.listAccounts).toHaveBeenCalled();

      expect(result).toStrictEqual(
        mockECA1ListAccountResponse.result.map((account) => ({
          name: account.name,
          address: account.address,
          custodianDetails: null,
          labels: account.tags.map((tag) => ({
            key: tag.name,
            value: tag.value,
          })),
        })),
      );
    });
  });

  describe('getEthereumAccountByAddress', () => {
    it('gets the accounts, and then filters by address', async () => {
      const result = await eca1CustodianApi.getEthereumAccountsByAddress(
        fromAddress,
      );

      expect(mockedEca1ClientInstance.listAccounts).toHaveBeenCalled();

      expect(result).toStrictEqual(
        mockECA1ListAccountResponse.result
          .map((account) => ({
            name: account.name,
            address: account.address,
            custodianDetails: null,
            labels: account.tags.map((tag) => ({
              key: tag.name,
              value: tag.value,
            })),
          }))
          .filter((account) => account.address === fromAddress),
      );
    });
  });

  describe('getEthereumAccountsByLabelOrAddressName', () => {
    it('gets the accounts, and then filters by account name', async () => {
      const result =
        await eca1CustodianApi.getEthereumAccountsByLabelOrAddressName(
          'Elegantly Jittery Viper Fish',
        );

      expect(result).toStrictEqual(
        mockECA1ListAccountResponse.result
          .map((account) => ({
            name: account.name,
            address: account.address,
            custodianDetails: null,
            labels: account.tags.map((tag) => ({
              key: tag.name,
              value: tag.value,
            })),
          }))
          .filter((account) => account.name === 'Elegantly Jittery Viper Fish'),
      );
    });
  });

  describe('createTransaction', () => {
    it('calls create transaction on the client (EIP-1559)', async () => {
      const txParams: IEIP1559TxParams = {
        from: fromAddress,
        to: 'to',
        value: '1',
        gasLimit: '1', // No data
        type: '2',
        maxFeePerGas: '10',
        maxPriorityFeePerGas: '20',
      };

      const result = await eca1CustodianApi.createTransaction(txParams, {
        chainId: '4',
        note: 'note',
        custodianPublishesTransaction: true,
      });

      expect(mockedEca1ClientInstance.createTransaction).toHaveBeenCalledWith([
        {
          from: fromAddress,
          to: txParams.to,
          gas: hexlify(txParams.gasLimit),
          value: hexlify(txParams.value!),
          data: undefined,
          maxFeePerGas: hexlify(txParams.maxFeePerGas),
          maxPriorityFeePerGas: hexlify(txParams.maxPriorityFeePerGas),
          type: hexlify(txParams.type),
        },
        { chainId: '0x4', note: 'note' },
      ]);

      expect(result).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        custodian_transactionId: mockECA1CreateTransactionResponse.result,
        transactionStatus: 'created',
        from: fromAddress,
      });
    });

    it('calls create transaction on the client (Legacy)', async () => {
      const txParams: ILegacyTXParams = {
        from: fromAddress,
        to: 'to',
        value: '1',
        gasLimit: '1', // No data
        type: '0',
        gasPrice: '10',
      };

      const result = await eca1CustodianApi.createTransaction(txParams, {
        chainId: '4',
        note: 'note',
        custodianPublishesTransaction: true,
      });

      expect(mockedEca1ClientInstance.createTransaction).toHaveBeenCalledWith([
        {
          from: fromAddress,
          to: txParams.to,
          gas: hexlify(txParams.gasLimit),
          value: hexlify(txParams.value!),
          data: undefined,
          gasPrice: hexlify(txParams.gasPrice),
          type: hexlify(txParams.type!),
        },
        { chainId: '0x4', note: 'note' },
      ]);

      expect(result).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        custodian_transactionId: mockECA1CreateTransactionResponse.result,
        transactionStatus: 'created',
        from: fromAddress,
      });
    });

    it('throws an error if the address does not exist', async () => {
      const txParams: ILegacyTXParams = {
        from: '0xfakeaddress',
        to: 'to',
        value: '1',
        gasLimit: '1', // No data
        type: '0',
        gasPrice: '10',
      };

      await expect(
        eca1CustodianApi.createTransaction(txParams, {
          chainId: '4',
          custodianPublishesTransaction: true,
        }),
      ).rejects.toThrow('No such ethereum account');
    });
  });

  describe('getTransaction', () => {
    it('calls getTransaction on the client', async () => {
      const result = await eca1CustodianApi.getTransaction(
        '',
        mockECA1GetTransactionByIdPayload[0],
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedEca1ClientInstance.getTransaction).toHaveBeenCalledWith(
        mockECA1GetTransactionByIdPayload,
      );

      expect(result).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        custodian_transactionId: mockECA1GetTransactionByIdResponse.result.id,
        transactionStatus: mapStatusObjectToStatusText(
          mockECA1GetTransactionByIdResponse.result.status,
        ),
        transactionStatusDisplayText:
          mockECA1GetTransactionByIdResponse.result.status.displayText,
        from: mockECA1GetTransactionByIdResponse.result.from,
        gasLimit: mockECA1GetTransactionByIdResponse.result.gas,
        gasPrice: mockECA1GetTransactionByIdResponse.result.gasPrice,
        maxFeePerGas: mockECA1GetTransactionByIdResponse.result.maxFeePerGas,
        maxPriorityFeePerGas:
          mockECA1GetTransactionByIdResponse.result.maxPriorityFeePerGas,
        nonce: mockECA1GetTransactionByIdResponse.result.nonce,
        transactionHash: mockECA1GetTransactionByIdResponse.result.hash,
        reason: null,
        to: mockECA1GetTransactionByIdResponse.result.to,
      });
    });

    it('will return null if there is no such transaction', async () => {
      jest
        .spyOn(mockedEca1ClientInstance, 'getTransaction')
        .mockImplementationOnce(async () =>
          Promise.resolve({
            result: null,
            id: 0,
            jsonrpc: '2.0',
          }),
        );
      const result = await eca1CustodianApi.getTransaction('', 'fake');

      expect(result).toBeNull();
    });
  });

  describe('getCustomerProof', () => {
    it('should call getCustomerProof on the client', async () => {
      const result = await eca1CustodianApi.getCustomerProof();
      expect(result).toStrictEqual(mockECA1GetCustomerProofResponse.result.jwt);
    });
  });

  describe('signTypedData_v4', () => {
    it('should call signTypedData on the client', async () => {
      const result = await eca1CustodianApi.signTypedData_v4(
        mockECA1SignTypedDataPayload[0],
        mockECA1SignTypedDataPayload[1],
        mockECA1SignTypedDataPayload[2],
        { chainId: '0x123' },
      );

      expect(mockedEca1ClientInstance.signTypedData).toHaveBeenCalledWith(
        mockECA1SignTypedDataPayload,
      );

      expect(result).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        custodian_transactionId: mockECA1SignTypedDataResponse.result,
        transactionStatus: 'created',
        from: mockECA1SignTypedDataPayload[0],
      });
    });

    it('should throw an error if the address does not exist', async () => {
      await expect(
        eca1CustodianApi.signTypedData_v4(
          'fake',
          mockECA1SignTypedDataPayload[1],
          mockECA1SignTypedDataPayload[2],
          { chainId: '0x123' },
        ),
      ).rejects.toThrow('No such ethereum account');
    });
  });

  describe('signPersonalMessage', () => {
    it('should call signPersonalMessage on the client', async () => {
      const result = await eca1CustodianApi.signPersonalMessage(
        mockECA1SignPayload[0],
        mockECA1SignPayload[1],
        { chainId: '0x123' },
      );

      expect(mockedEca1ClientInstance.signPersonalMessage).toHaveBeenCalledWith(
        mockECA1SignPayload,
      );

      expect(result).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        custodian_transactionId: mockECA1SignResponse.result,
        transactionStatus: 'created',
        from: mockECA1SignTypedDataPayload[0],
      });
    });

    it('should throw an error if the address does not exist', async () => {
      await expect(
        eca1CustodianApi.signPersonalMessage('fake', mockECA1SignPayload[1], {
          chainId: '0x123',
        }),
      ).rejects.toThrow('No such ethereum account');
    });
  });

  describe('getSupportedChains', () => {
    it('should call getAccountChainIds on the client', async () => {
      const result = await eca1CustodianApi.getSupportedChains('0xtest');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedEca1ClientInstance.getAccountChainIds).toHaveBeenCalledWith([
        '0xtest',
      ]);

      expect(result).toStrictEqual(mockECA1ListAccountChainIdsResponse.result);
    });
  });

  describe('getTransactionLink', () => {
    it('should call getTransactionLink on the client', async () => {
      const result = await eca1CustodianApi.getTransactionLink(
        mockECA1GetTransactionLinkPayload[0],
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedEca1ClientInstance.getTransactionLink).toHaveBeenCalledWith(
        mockECA1GetTransactionLinkPayload,
      );

      expect(result).toStrictEqual({
        id: mockECA1GetTransactionLinkResponse.result.transactionId,
        url: mockECA1GetTransactionLinkResponse.result.url,
        action: mockECA1GetTransactionLinkResponse.result.action,
        text: mockECA1GetTransactionLinkResponse.result.text,
        ethereum: mockECA1GetTransactionLinkResponse.result.ethereum,
      });
    });
  });
});
