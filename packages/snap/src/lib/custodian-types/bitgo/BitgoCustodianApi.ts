import { EventEmitter } from 'events';

import { BitgoClient } from './BitgoClient';
import { DefaultBitgoCustodianDetails } from './DefaultBitgoCustodianDetails';
import type {
  CustodianDeepLink,
  IEIP1559TxParams,
  IEthereumAccount,
  ILegacyTXParams,
  IRefreshTokenAuthDetails,
  ICustodianApi,
} from '../../types';
import type { IBitgoEthereumAccountCustodianDetails } from './interfaces/IBitgoEthereumAccountCustodianDetails';
import type { IBitgoTransaction } from './interfaces/IBitgoTransaction';
import logger from '../../../logger';
import { mapTransactionStatus } from '../../../util/map-status';
import type {
  SignedMessageDetails,
  TransactionDetails,
} from '../../structs/CustodialKeyringStructs';
import type { MessageTypes, TypedMessage } from '../../types/ITypedMessage';

const BITGO_ADDITIONAL_GAS = 100000;

export class BitgoCustodianApi extends EventEmitter implements ICustodianApi {
  #client: BitgoClient;

  constructor(
    authDetails: IRefreshTokenAuthDetails,
    // eslint-disable-next-line @typescript-eslint/default-param-last
    apiUrl = DefaultBitgoCustodianDetails.apiUrl,
    _cacheAge: number,
  ) {
    super();

    // Bitgo's token is not actually a refresh token, but to simplify
    // the interface, we treat it as one.
    const { refreshToken } = authDetails;
    this.#client = new BitgoClient(apiUrl, refreshToken);
  }

  async getEthereumAccounts(
    chainId?: number,
  ): Promise<IEthereumAccount<IBitgoEthereumAccountCustodianDetails>[]> {
    const accounts = await this.#client.getEthereumAccounts();

    const mappedAccounts = accounts.map((account) => ({
      name:
        account.labels.find((label) => label.key === 'Wallet Name')?.value ??
        'Unnamed Bitgo Wallet',
      address: account.address,
      balance: account.balance,
      custodianDetails: {
        accountId: account.custodianDetails.id,
        coinId: account.custodianDetails.coin,
      },
      chainId: account.chainId,
      labels: account.labels.filter((label) => label.key !== 'Wallet Name'),
    }));

    if (!chainId) {
      return mappedAccounts;
    }
    return mappedAccounts.filter((account) => account.chainId === chainId);
  }

  async getEthereumAccountsByAddress(
    address: string,
  ): Promise<IEthereumAccount<IBitgoEthereumAccountCustodianDetails>[]> {
    const accounts = await this.getEthereumAccounts();
    return accounts.filter((account) =>
      account.address.toLowerCase().includes(address.toLowerCase()),
    );
  }

  async getEthereumAccountsByLabelOrAddressName(
    name: string,
  ): Promise<IEthereumAccount<IBitgoEthereumAccountCustodianDetails>[]> {
    const accounts = await this.getEthereumAccounts();
    return accounts.filter((account) => account.name.includes(name));
  }

  async createTransaction(
    txParams: IEIP1559TxParams | ILegacyTXParams,
  ): Promise<TransactionDetails> {
    const fromAddress = txParams.from;

    const accounts = await this.getEthereumAccountsByAddress(fromAddress);

    if (!accounts.length || !accounts[0]?.custodianDetails) {
      throw new Error('No such ethereum account!');
    }

    const walletId = accounts[0].custodianDetails.accountId;
    const { coinId } = accounts[0].custodianDetails;

    txParams.gasLimit = (
      Number(txParams.gasLimit) + BITGO_ADDITIONAL_GAS
    ).toString();

    let result: IBitgoTransaction;
    try {
      result = await this.#client.createTransaction(
        { walletId, coinId },
        txParams,
      );
    } catch (error) {
      logger.error(`Error creating BitGo transaction.`);
      logger.error(error);
      throw error;
    }

    return {
      transactionStatus: mapTransactionStatus(result.transactionStatus),
      custodianTransactionId: result.custodianTransactionId,
      from: result.from,
      gasLimit: result.gasLimit ?? null,
      gasPrice: result.gasPrice ?? null,
      maxFeePerGas: result.maxFeePerGas ?? null,
      maxPriorityFeePerGas: result.maxPriorityFeePerGas ?? null,
      nonce: result.nonce ?? null,
      transactionHash: result.transactionHash,
      custodianPublishesTransaction: true,
    };
  }

  async getTransaction(
    _from: string,
    custodianTransactionId: string,
  ): Promise<TransactionDetails | null> {
    const result = await this.#client.getTransaction(custodianTransactionId);

    if (!result) {
      return null;
    }

    return {
      transactionStatus: mapTransactionStatus(result.transactionStatus),
      custodianTransactionId: result.custodianTransactionId,
      from: result.from,
      gasLimit: result.gasLimit ?? null,
      gasPrice: result.gasPrice ?? null,
      maxFeePerGas: result.maxFeePerGas ?? null,
      maxPriorityFeePerGas: result.maxPriorityFeePerGas ?? null,
      nonce: result.nonce ?? null,
      transactionHash: result.transactionHash,
      custodianPublishesTransaction: true,
    };
  }

  // Obtain a JWT from the custodian that we can use to authenticate to
  public async getCustomerProof(): Promise<string> {
    const { data } = await this.#client.getCustomerProof();
    return data;
  }

  async getSupportedChains(address: string): Promise<string[]> {
    const account = await this.#client.getEthereumAccountByAddress(address);
    if (!account) {
      return [];
    }

    return [account.chainId.toString()];
  }

  async getTransactionLink(
    _transactionId: string,
  ): Promise<Partial<CustodianDeepLink> | null> {
    return {
      text: 'Complete your transaction in the BitGo App',
      id: '',
      url: '',
      action: 'view',
    };
  }

  async getSignedMessageLink(
    _signedMessageId: string,
  ): Promise<Partial<CustodianDeepLink> | null> {
    return {
      text: 'Complete your transaction in the BitGo App',
      id: '',
      url: '',
      action: 'view',
    };
  }

  changeRefreshTokenAuthDetails(_authDetails: any): void {
    throw new Error('BitGo does not support refresh tokens');
  }

  async getSignedMessage(
    address: string,
    custodianSignedMessageId: string,
  ): Promise<SignedMessageDetails | null> {
    const accounts = await this.getEthereumAccountsByAddress(address);

    if (!accounts.length) {
      throw new Error('No such ethereum account!');
    }

    if (!accounts[0]?.custodianDetails) {
      throw new Error('No such ethereum account!');
    }

    const walletId = accounts[0].custodianDetails.accountId;
    const { coinId } = accounts[0].custodianDetails;

    const result = await this.#client.getSignedMessage(
      custodianSignedMessageId,
      coinId,
      walletId,
    );

    if (!result) {
      return null;
    }

    return {
      id: result.data.id,
      signature: result.data.signature,
      status: result.data.status,
    };
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async signTypedData_v4(
    address: string,
    message: TypedMessage<MessageTypes>,
    version: string,
  ): Promise<SignedMessageDetails> {
    const accounts = await this.getEthereumAccountsByAddress(address);

    if (!accounts.length || !accounts[0]?.custodianDetails) {
      throw new Error('No such ethereum account!');
    }

    const walletId = accounts[0].custodianDetails.accountId;
    const { coinId } = accounts[0].custodianDetails;

    const result = await this.#client.signTypedData_v4(
      address,
      message,
      coinId,
      walletId,
      version,
    );

    return {
      id: result.data.id,
      signature: result.data.signature,
      status: result.data.status,
      from: address,
    };
  }

  async signPersonalMessage(
    address: string,
    message: string,
  ): Promise<SignedMessageDetails> {
    const accounts = await this.getEthereumAccountsByAddress(address);

    if (!accounts.length || !accounts[0]?.custodianDetails) {
      throw new Error('No such ethereum account!');
    }

    const walletId = accounts[0].custodianDetails.accountId;
    const { coinId } = accounts[0].custodianDetails;

    const result = await this.#client.signPersonalMessage(
      address,
      message,
      coinId,
      walletId,
    );

    return {
      id: result.data.id,
      signature: result.data.signature,
      status: result.data.status,
      from: address,
    };
  }
}
