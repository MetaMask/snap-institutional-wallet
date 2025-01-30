/* eslint-disable @typescript-eslint/unbound-method */
import { ECA3Client } from './ECA3Client';
import { ECA3CustodianApi } from './ECA3CustodianApi';
import { mockECA3CreateTransactionResponse } from './mocks/mockECA3CreateTransactionResponse';
import { mockECA3GetCustomerProofResponse } from './mocks/mockECA3GetCustomerProofResponse';
import { mockECA3GetSignedMessageLinkPayload } from './mocks/mockECA3GetSignedMessageLinkPayload';
import { mockECA3GetTransactionByIdPayload } from './mocks/mockECA3GetTransactionByIdPayload';
import { mockECA3GetTransactionByIdResponse } from './mocks/mockECA3GetTransactionByIdResponse';
import { mockECA3GetTransactionLinkPayload } from './mocks/mockECA3GetTransactionLinkPayload';
import { mockECA3GetTransactionLinkResponse } from './mocks/mockECA3GetTransactionLinkResponse';
import { mockECA3ListAccountChainIdsResponse } from './mocks/mockECA3ListAccountChainIdsResponse';
import { mockECA3ListAccountResponse } from './mocks/mockECA3ListAccountResponse';
import { mockECA3SignPayload } from './mocks/mockECA3SignPayload';
import { mockECA3SignResponse } from './mocks/mockECA3SignResponse';
import { mockECA3SignTypedDataPayload } from './mocks/mockECA3SignTypedDataPayload';
import { mockECA3SignTypedDataResponse } from './mocks/mockECA3SignTypedDataResponse';
import { hexlify } from '../../../util/hexlify';
import type { IEIP1559TxParams } from '../../types';
import { mockECA3GetSignedMessageLinkResponse } from './mocks/mockECA3GetSignedMessageLinkResponse';

jest.mock('./ECA3Client');

describe('ECA3CustodianApi', () => {
  let eca3CustodianApi: ECA3CustodianApi;
  const mockedEca3Client = jest.mocked(ECA3Client, { shallow: true });
  let mockedEca3ClientInstance: ECA3Client;

  const mockJwt = 'mock-jwt';
  const mockUrl = 'http://mock-url';
  const mockRefreshTokenUrl = 'http://mock-refresh-token-url';

  const fromAddress = mockECA3ListAccountResponse.result[0]!.address;

  beforeEach(() => {
    eca3CustodianApi = new ECA3CustodianApi(
      { refreshToken: mockJwt, refreshTokenUrl: mockRefreshTokenUrl },
      mockUrl,
      0,
    );

    mockedEca3ClientInstance = mockedEca3Client.mock.instances[0] as ECA3Client;
    jest
      .spyOn(mockedEca3ClientInstance, 'listAccounts')
      .mockImplementation(async () =>
        Promise.resolve(mockECA3ListAccountResponse),
      );

    jest
      .spyOn(mockedEca3ClientInstance, 'createTransaction')
      .mockImplementation(async () =>
        Promise.resolve(mockECA3CreateTransactionResponse),
      );

    jest
      .spyOn(mockedEca3ClientInstance, 'getTransaction')
      .mockImplementation(async () =>
        Promise.resolve(mockECA3GetTransactionByIdResponse),
      );

    jest
      .spyOn(mockedEca3ClientInstance, 'getTransactionLink')
      .mockImplementation(async () =>
        Promise.resolve(mockECA3GetTransactionLinkResponse),
      );

    jest
      .spyOn(mockedEca3ClientInstance, 'getSignedMessageLink')
      .mockImplementation(async () =>
        Promise.resolve(mockECA3GetSignedMessageLinkResponse),
      );

    jest
      .spyOn(mockedEca3ClientInstance, 'getCustomerProof')
      .mockImplementation(async () =>
        Promise.resolve(mockECA3GetCustomerProofResponse),
      );

    jest
      .spyOn(mockedEca3ClientInstance, 'signTypedData')
      .mockImplementation(async () =>
        Promise.resolve(mockECA3SignTypedDataResponse),
      );

    jest
      .spyOn(mockedEca3ClientInstance, 'signPersonalMessage')
      .mockImplementation(async () => Promise.resolve(mockECA3SignResponse));

    jest
      .spyOn(mockedEca3ClientInstance, 'getAccountChainIds')
      .mockImplementation(async () =>
        Promise.resolve(mockECA3ListAccountChainIdsResponse),
      );

    mockedEca3Client.mockClear();
  });

  describe('getEthereumAccounts', () => {
    it('returns the accounts', async () => {
      const result = await eca3CustodianApi.getEthereumAccounts();
      expect(mockedEca3ClientInstance.listAccounts).toHaveBeenCalled();

      expect(result).toStrictEqual(
        mockECA3ListAccountResponse.result.map((account) => ({
          name: account.name,
          address: account.address,
          custodianDetails: null,
          labels: account.tags.map((tag) => ({
            key: tag.name,
            value: tag.value,
          })),
          metadata: {
            active: true,
            deleted: false,
            isContract: false,
          },
        })),
      );
    });
  });

  describe('getEthereumAccountByAddress', () => {
    it('gets the accounts, and then filters by address', async () => {
      const result = await eca3CustodianApi.getEthereumAccountsByAddress(
        fromAddress,
      );

      expect(mockedEca3ClientInstance.listAccounts).toHaveBeenCalled();

      expect(result).toStrictEqual(
        mockECA3ListAccountResponse.result
          .filter((account) =>
            account.address.toLowerCase().includes(fromAddress.toLowerCase()),
          )
          .map((account) => ({
            name: account.name,
            address: account.address,
            custodianDetails: null,
            labels: account.tags.map((tag) => ({
              key: tag.name,
              value: tag.value,
            })),
            metadata: {
              active: true,
              deleted: false,
              isContract: false,
            },
          })),
      );
    });
  });

  describe('createTransaction', () => {
    it('calls create transaction on the client (EIP1559)', async () => {
      const txParams: IEIP1559TxParams = {
        from: fromAddress,
        to: 'to',
        value: '1',
        gasLimit: '1',
        maxFeePerGas: '20',
        maxPriorityFeePerGas: '2',
        type: '2',
      };

      await eca3CustodianApi.createTransaction(txParams, {
        chainId: '0x4',
        note: 'note',
        custodianPublishesTransaction: true,
      });

      expect(mockedEca3ClientInstance.createTransaction).toHaveBeenCalledWith([
        {
          from: fromAddress,
          to: txParams.to,
          value: hexlify(txParams.value!),
          gas: hexlify(txParams.gasLimit),
          maxFeePerGas: hexlify(txParams.maxFeePerGas),
          maxPriorityFeePerGas: hexlify(txParams.maxPriorityFeePerGas),
          type: hexlify(txParams.type),
        },
        {
          chainId: '0x4',
          note: 'note',
          custodianPublishesTransaction: true,
        },
      ]);
    });

    it('throws an error if the address does not exist', async () => {
      const txParams: IEIP1559TxParams = {
        from: '0xfakeaddress',
        to: 'to',
        value: '1',
        gasLimit: '1',
        type: '2',
        maxFeePerGas: '20',
        maxPriorityFeePerGas: '2',
      };

      await expect(
        eca3CustodianApi.createTransaction(txParams, {
          chainId: '4',
          custodianPublishesTransaction: true,
        }),
      ).rejects.toThrow('No such ethereum account');
    });
  });

  describe('getTransaction', () => {
    it('calls getTransaction on the client', async () => {
      const result = await eca3CustodianApi.getTransaction(
        '0x1',
        mockECA3GetTransactionByIdPayload[0],
      );

      expect(mockedEca3ClientInstance.getTransaction).toHaveBeenCalledWith(
        mockECA3GetTransactionByIdPayload,
      );

      expect(result).toStrictEqual({
        custodianTransactionId:
          mockECA3GetTransactionByIdResponse.result.transaction.id,
        custodianPublishesTransaction: true,
        from: mockECA3GetTransactionByIdResponse.result.transaction.from,
        to: mockECA3GetTransactionByIdResponse.result.transaction.to,
        nonce: mockECA3GetTransactionByIdResponse.result.transaction.nonce,
        gasPrice:
          mockECA3GetTransactionByIdResponse.result.transaction.gasPrice,
        gasLimit: mockECA3GetTransactionByIdResponse.result.transaction.gas,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        transactionHash:
          mockECA3GetTransactionByIdResponse.result.transaction.hash,
        chainId: '1',
        rpcUrl: 'https://rpc.example.com',
        signedRawTransaction: null,
        transactionStatus:
          mockECA3GetTransactionByIdResponse.result.transaction.status,
      });
    });

    it('will return null if there is no such transaction', async () => {
      jest
        .spyOn(mockedEca3ClientInstance, 'getTransaction')
        .mockImplementationOnce(async () =>
          Promise.resolve({ result: null, id: 0, jsonrpc: '2.0' }),
        );
      const result = await eca3CustodianApi.getTransaction('', 'fake');

      expect(result).toBeNull();
    });
  });

  describe('getCustomerProof', () => {
    it('should call getCustomerProof on the client', async () => {
      const result = await eca3CustodianApi.getCustomerProof();
      expect(result).toStrictEqual(mockECA3GetCustomerProofResponse.result.jwt);
    });
  });

  describe('signTypedData_v4', () => {
    it('should call signTypedData on the client', async () => {
      const result = await eca3CustodianApi.signTypedData_v4(
        mockECA3SignTypedDataPayload[0].address,
        mockECA3SignTypedDataPayload[0].data,
        'v4',
        { chainId: '0x1', note: '', originUrl: 'metamask' },
      );

      expect(mockedEca3ClientInstance.signTypedData).toHaveBeenCalledWith([
        mockECA3SignTypedDataPayload[0],
        { chainId: '0x1', note: '', originUrl: 'metamask' },
      ]);

      expect(result).toStrictEqual({
        id: mockECA3SignTypedDataResponse.result,
        status: {
          displayText: 'Created',
          finished: false,
          reason: '',
          signed: false,
          submitted: false,
          success: false,
        },
        from: mockECA3SignTypedDataPayload[0].address,
        signature: null,
      });
    });
    it('should throw an error if the address does not exist', async () => {
      jest
        .spyOn(mockedEca3ClientInstance, 'listAccounts')
        .mockImplementationOnce(async () =>
          Promise.resolve({ result: [], id: 0, jsonrpc: '2.0' }),
        );

      await expect(
        eca3CustodianApi.signTypedData_v4(
          'fake',
          mockECA3SignTypedDataPayload[0].data,
          'v4',
          { chainId: '0x123' },
        ),
      ).rejects.toThrow('No such ethereum account');
    });
  });

  describe('signPersonalMessage', () => {
    it('should call signPersonalMessage on the client', async () => {
      // Mock listAccounts to return an account that matches the signing address
      jest
        .spyOn(mockedEca3ClientInstance, 'listAccounts')
        .mockResolvedValueOnce({
          id: 0,
          jsonrpc: '2.0',
          result: [
            {
              address: mockECA3SignPayload[0].address,
              name: 'Test Account',
              tags: [{ name: 'test', value: 'test' }],
              metadata: {
                active: true,
                deleted: false,
                isContract: false,
              },
            },
          ],
        });

      const result = await eca3CustodianApi.signPersonalMessage(
        mockECA3SignPayload[0].address,
        mockECA3SignPayload[0].message,
        { chainId: '0x123' },
      );

      expect(mockedEca3ClientInstance.signPersonalMessage).toHaveBeenCalledWith(
        [
          {
            address: mockECA3SignPayload[0].address,
            message: mockECA3SignPayload[0].message,
          },
          { chainId: '0x123' },
        ],
      );

      expect(result).toStrictEqual({
        id: mockECA3SignResponse.result,
        status: {
          displayText: 'Created',
          finished: false,
          reason: '',
          signed: false,
          submitted: false,
          success: false,
        },
        from: mockECA3SignPayload[0].address,
        signature: null,
      });
    });

    it('should throw an error if the address does not exist', async () => {
      await expect(
        eca3CustodianApi.signPersonalMessage(
          'fake',
          mockECA3SignPayload[0].message,
          { chainId: '0x123' },
        ),
      ).rejects.toThrow('No such ethereum account');
    });
  });

  describe('getSupportedChains', () => {
    it('should call getAccountChainIds on the client', async () => {
      const result = await eca3CustodianApi.getSupportedChains('0xtest');

      expect(mockedEca3ClientInstance.getAccountChainIds).toHaveBeenCalledWith([
        '0xtest',
      ]);

      expect(result).toStrictEqual(mockECA3ListAccountChainIdsResponse.result);
    });
  });

  describe('getTransactionLink', () => {
    it('should call getTransactionLink on the client', async () => {
      const result = await eca3CustodianApi.getTransactionLink(
        mockECA3GetTransactionLinkPayload[0],
      );

      expect(mockedEca3ClientInstance.getTransactionLink).toHaveBeenCalledWith(
        mockECA3GetTransactionLinkPayload,
      );

      expect(result).toStrictEqual({
        id: mockECA3GetTransactionLinkResponse.result.transactionId,
        url: mockECA3GetTransactionLinkResponse.result.url,
        action: mockECA3GetTransactionLinkResponse.result.action,
        text: mockECA3GetTransactionLinkResponse.result.text,
        ethereum: mockECA3GetTransactionLinkResponse.result.ethereum,
      });
    });
  });

  describe('getSignedMessageLink', () => {
    it('should call getSignedMessageLink on the client', async () => {
      const result = await eca3CustodianApi.getSignedMessageLink(
        mockECA3GetSignedMessageLinkPayload[0],
      );

      expect(
        mockedEca3ClientInstance.getSignedMessageLink,
      ).toHaveBeenCalledWith(mockECA3GetSignedMessageLinkPayload);

      expect(result).toStrictEqual({
        id: mockECA3GetSignedMessageLinkResponse.result.signedMessageId,
        url: mockECA3GetSignedMessageLinkResponse.result.url,
        action: mockECA3GetSignedMessageLinkResponse.result.action,
        text: mockECA3GetSignedMessageLinkResponse.result.text,
        ethereum: mockECA3GetSignedMessageLinkResponse.result.ethereum,
      });
    });
  });
});
