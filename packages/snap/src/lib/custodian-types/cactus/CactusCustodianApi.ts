import { EventEmitter } from 'events';

import { CactusClient } from './CactusClient';
import { DefaultCactusCustodianDetails } from './DefaultCactusCustodianDetails';
import type { ICactusEthereumAccountCustodianDetails } from './interfaces/ICactusEthereumAccountCustodianDetails';
import { mapTransactionStatus } from '../../../util/map-status';
import { SimpleCache } from '../../simple-cache';
import type {
  SignedMessageDetails,
  TransactionDetails,
} from '../../structs/CustodialKeyringStructs';
import type {
  ICustodianApi,
  CustodianDeepLink,
  IEIP1559TxParams,
  IEthereumAccount,
  ILegacyTXParams,
  IMetamaskContractMetadata,
  IRefreshTokenAuthDetails,
} from '../../types';
import type { CreateTransactionMetadata } from '../../types/CreateTransactionMetadata';
import type { MessageTypes, TypedMessage } from '../../types/ITypedMessage';

export class CactusCustodianApi extends EventEmitter implements ICustodianApi {
  #client: CactusClient;

  #cache = new SimpleCache();

  #cacheAge: number;

  constructor(
    authDetails: IRefreshTokenAuthDetails,
    // eslint-disable-next-line @typescript-eslint/default-param-last
    apiUrl = DefaultCactusCustodianDetails.apiUrl,
    cacheAge: number,
  ) {
    super();
    this.#cacheAge = cacheAge;
    this.#client = new CactusClient(apiUrl, authDetails.refreshToken);
  }

  async getEthereumAccounts(): Promise<
    IEthereumAccount<ICactusEthereumAccountCustodianDetails>[]
  > {
    const accounts = await this.#client.getEthereumAccounts();

    const mappedAccounts = accounts.map((account) => ({
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
    }));

    return mappedAccounts;
  }

  async getEthereumAccountsByAddress(
    address: string,
  ): Promise<IEthereumAccount<ICactusEthereumAccountCustodianDetails>[]> {
    const accounts = await this.getEthereumAccounts();

    return accounts.filter((account) =>
      account.address.toLowerCase().includes(address.toLowerCase()),
    );
  }

  async getEthereumAccountsByLabelOrAddressName(
    name: string,
  ): Promise<IEthereumAccount<ICactusEthereumAccountCustodianDetails>[]> {
    const accounts = await this.getEthereumAccounts();

    if (!name.length) {
      return accounts;
    }

    return accounts.filter((account) =>
      new RegExp(name, 'u').test(account.name),
    );
  }

  async createTransaction(
    txParams: IEIP1559TxParams | ILegacyTXParams,
    txMeta: CreateTransactionMetadata,
  ): Promise<TransactionDetails> {
    const result = await this.#client.createTransaction(
      { chainId: Number(txMeta.chainId), note: txMeta.note ?? '' },
      txParams,
    );

    return {
      transactionStatus: mapTransactionStatus(result.transactionStatus),
      custodianTransactionId: result.custodian_transactionId,
      from: result.from,
      gasLimit: result.gasLimit,
      gasPrice: result.gasPrice,
      maxFeePerGas: result.maxFeePerGas,
      maxPriorityFeePerGas: result.maxFeePerGas,
      nonce: result.nonce,
      transactionHash: result.transactionHash,
      custodianPublishesTransaction: true,
    };
  }

  async getTransaction(
    _from: string,
    custodianTransactionId: string,
  ): Promise<TransactionDetails | null> {
    const result = await this.#client.getTransaction(custodianTransactionId);

    // Cactus API sometimes returns 200 but gives us nothing
    if (!result) {
      return null;
    }

    return {
      transactionStatus: mapTransactionStatus(result.transactionStatus),
      custodianTransactionId: result.custodian_transactionId,
      from: result.from,
      gasLimit: result.gasLimit,
      gasPrice: result.gasPrice,
      maxFeePerGas: result.maxFeePerGas,
      maxPriorityFeePerGas: result.maxPriorityFeePerGas,
      nonce: result.nonce,
      transactionHash: result.transactionHash,
      custodianPublishesTransaction: true,
    };
  }

  async getSignedMessage(
    address: string,
    custodianSignedMessageId: string,
  ): Promise<SignedMessageDetails | null> {
    const result = await this.#client.getSignedMessage(
      custodianSignedMessageId,
    );

    if (!result) {
      return null;
    }
    return {
      id: result.custodian_transactionId ?? '',
      signature: result.signature,
      status: mapTransactionStatus(result.transactionStatus),
      from: address,
    };
  }

  // Obtain a JWT from the custodian that we can use to authenticate to
  public async getCustomerProof(): Promise<string> {
    const { jwt } = await this.#client.getCustomerProof();
    return jwt;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async signTypedData_v4(
    address: string,
    message: TypedMessage<MessageTypes>,
    version: string,
  ): Promise<SignedMessageDetails> {
    const result = await this.#client.signTypedData_v4(
      address,
      message,
      version,
      message.domain?.chainId,
    );

    return {
      id: result.custodian_transactionId,
      status: mapTransactionStatus(result.transactionStatus),
      from: address,
      signature: null,
    };
  }

  async signPersonalMessage(
    address: string,
    message: string,
  ): Promise<SignedMessageDetails> {
    const result = await this.#client.signPersonalMessage(address, message);

    return {
      id: result.custodian_transactionId,
      status: mapTransactionStatus(result.transactionStatus),
      from: address,
      signature: null,
    };
  }

  async getErc20Tokens(): Promise<IMetamaskContractMetadata> {
    return {};
  }

  async getSupportedChains(): Promise<string[]> {
    const { networks } = await this.#client.getChainIds();
    return this.#cache.tryCaching<string[]>(
      'getSupportedChains',
      this.#cacheAge,
      async () => {
        return networks.map((network) => network.chainID);
      },
    );
  }

  async getTransactionLink(
    _transactionId: string,
  ): Promise<Partial<CustodianDeepLink> | null> {
    return {
      text: 'Complete your transaction in the Cactus App',
      id: '',
      url: '',
      action: 'view',
    };
  }

  async getSignedMessageLink(
    _signedMessageId: string,
  ): Promise<Partial<CustodianDeepLink> | null> {
    return {
      text: 'Complete your transaction in the Cactus App',
      id: '',
      url: '',
      action: 'view',
    };
  }

  changeRefreshTokenAuthDetails(_authDetails: IRefreshTokenAuthDetails): void {
    throw new Error('Not implemented yet');
  }
}
