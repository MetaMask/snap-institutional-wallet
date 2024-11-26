import { EventEmitter } from 'events';

import { CactusClient } from './CactusClient';
import { DefaultCactusCustodianDetails } from './DefaultCactusCustodianDetails';
import type { ICactusEthereumAccountCustodianDetails } from './interfaces/ICactusEthereumAccountCustodianDetails';
import { mapTransactionStatus } from '../../../util/map-status';
import { SimpleCache } from '../../simple-cache';
import type {
  ICustodianApi,
  AuthTypes,
  CustodianDeepLink,
  IEIP1559TxParams,
  IEthereumAccount,
  ILegacyTXParams,
  IMetamaskContractMetadata,
  IRefreshTokenAuthDetails,
  ISignedMessageDetails,
  ITransactionDetails,
} from '../../types';
import type { CreateTransactionMetadata } from '../../types/CreateTransactionMetadata';
import type { MessageTypes, TypedMessage } from '../../types/ITypedMessage';

export class CactusCustodianApi extends EventEmitter implements ICustodianApi {
  private readonly client: CactusClient;

  private readonly cache = new SimpleCache();

  constructor(
    authDetails: IRefreshTokenAuthDetails,
    _authType: AuthTypes,
    apiUrl = DefaultCactusCustodianDetails.apiUrl,
    private readonly cacheAge: number,
  ) {
    super();
    this.client = new CactusClient(apiUrl, authDetails.refreshToken);
  }

  async getEthereumAccounts(): Promise<
    IEthereumAccount<ICactusEthereumAccountCustodianDetails>[]
  > {
    const accounts = await this.client.getEthereumAccounts();

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

    return accounts.filter((account) => new RegExp(name).test(account.name));
  }

  async createTransaction(
    txParams: IEIP1559TxParams | ILegacyTXParams,
    txMeta: CreateTransactionMetadata,
  ): Promise<ITransactionDetails> {
    const result = await this.client.createTransaction(
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
    custodian_transactionId: string,
  ): Promise<ITransactionDetails | null> {
    const result = await this.client.getTransaction(custodian_transactionId);

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
    custodian_signedMessageId: string,
  ): Promise<ISignedMessageDetails | null> {
    const result = await this.client.getSignedMessage(
      custodian_signedMessageId,
    );

    if (!result || !(result.signature && result.signature.length)) {
      return null;
    }
    return {
      id: result.custodian_transactionId,
      signature: result.signature,
      status: mapTransactionStatus(result.transactionStatus),
      from: address,
    };
  }

  // Obtain a JWT from the custodian that we can use to authenticate to
  public async getCustomerProof(): Promise<string> {
    const { jwt } = await this.client.getCustomerProof();
    return jwt;
  }

  async signTypedData_v4(
    address: string,
    message: TypedMessage<MessageTypes>,
    version: string,
  ): Promise<ISignedMessageDetails> {
    const result = await this.client.signTypedData_v4(
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
  ): Promise<ISignedMessageDetails> {
    const result = await this.client.signPersonalMessage(address, message);

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
    const { networks } = await this.client.getChainIds();
    return this.cache.tryCaching<string[]>(
      'getSupportedChains',
      this.cacheAge,
      async () => {
        return networks.map((network) => network.chainID);
      },
    );
  }

  async getTransactionLink(
    _transactionId: string,
  ): Promise<Partial<CustodianDeepLink> | null> {
    return null;
  }

  async getSignedMessageLink(
    _signedMessageId: string,
  ): Promise<Partial<CustodianDeepLink> | null> {
    return null;
  }

  changeRefreshTokenAuthDetails(authDetails: IRefreshTokenAuthDetails): void {
    throw new Error('Not implemented yet');
  }
}
