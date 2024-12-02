import EventEmitter from 'events';

import { ECA1Client } from './ECA1Client';
import type {
  ECA1TransactionMeta,
  ECA1TransactionParams,
} from './rpc-payloads/ECA1CreateTransactionPayload';
import { hexlify } from '../../../util/hexlify';
import { mapTransactionStatus } from '../../../util/map-status';
import { SimpleCache } from '../../simple-cache/SimpleCache';
import type {
  CustodianDeepLink,
  IRefreshTokenChangeEvent,
  SignedMessageMetadata,
  SignedTypedMessageMetadata,
} from '../../types';
import type { CreateTransactionMetadata } from '../../types/CreateTransactionMetadata';
import type { ICustodianApi } from '../../types/ICustodianApi';
import type { IEthereumAccount } from '../../types/IEthereumAccount';
import type { IEthereumAccountCustodianDetails } from '../../types/IEthereumAccountCustodianDetails';
import type { IRefreshTokenAuthDetails } from '../../types/IRefreshTokenAuthDetails';
import type { ISignedMessageDetails } from '../../types/ISignedMessageDetails';
import type { ITransactionDetails } from '../../types/ITransactionDetails';
import type { ILegacyTXParams, IEIP1559TxParams } from '../../types/ITXParams';
import type { MessageTypes, TypedMessage } from '../../types/ITypedMessage';
import { REFRESH_TOKEN_CHANGE_EVENT, TOKEN_EXPIRED_EVENT } from '../constants';

export class ECA1CustodianApi extends EventEmitter implements ICustodianApi {
  #client: ECA1Client;

  #cache = new SimpleCache();

  #cacheAge: number;

  constructor(
    authDetails: IRefreshTokenAuthDetails,
    apiUrl: string,
    cacheAge: number,
  ) {
    super();
    const { refreshToken } = authDetails;
    this.#client = new ECA1Client(
      apiUrl,
      refreshToken,
      authDetails.refreshTokenUrl,
    );

    this.#cacheAge = cacheAge;

    // This event is "bottom up" - from the custodian via the client.

    this.#client.on(
      REFRESH_TOKEN_CHANGE_EVENT,
      (event: IRefreshTokenChangeEvent) => {
        this.emit(REFRESH_TOKEN_CHANGE_EVENT, event);
      },
    );

    this.#client.on(TOKEN_EXPIRED_EVENT, (event) => {
      this.emit(TOKEN_EXPIRED_EVENT, event);
    });
  }

  async getEthereumAccounts(): Promise<
    IEthereumAccount<IEthereumAccountCustodianDetails>[]
  > {
    const accounts = await this.#client.listAccounts();

    const mappedAccounts = accounts.result.map((account) => ({
      name: account.name,
      address: account.address,
      custodianDetails: null,
      labels: account.tags.map((tag) => ({ key: tag.name, value: tag.value })),
    }));

    return mappedAccounts;
  }

  async getEthereumAccountsByAddress(
    address: string,
  ): Promise<IEthereumAccount<IEthereumAccountCustodianDetails>[]> {
    const accounts = await this.getEthereumAccounts();

    return accounts.filter((account) =>
      account.address.toLowerCase().includes(address.toLowerCase()),
    );
  }

  async getEthereumAccountsByLabelOrAddressName(
    name: string,
  ): Promise<IEthereumAccount<IEthereumAccountCustodianDetails>[]> {
    const accounts = await this.getEthereumAccounts();
    return accounts.filter((account) => account.name.includes(name));
  }

  async createTransaction(
    txParams: IEIP1559TxParams | ILegacyTXParams,
    txMeta: CreateTransactionMetadata,
  ): Promise<ITransactionDetails> {
    const accounts = await this.getEthereumAccountsByAddress(txParams.from);

    if (!accounts.length || !accounts[0]?.address) {
      throw new Error('No such ethereum account!');
    }

    const payload: Partial<ECA1TransactionParams> = {
      from: accounts[0].address, // already hexlified
      to: txParams.to, // already hexlified
      ...(txParams.data && { data: txParams.data }),
      ...(txParams.value && { value: hexlify(txParams.value) }),
      ...(txParams.gasLimit && { gas: hexlify(txParams.gasLimit) }),
      ...(txParams.type && { type: hexlify(txParams.type) }),
    };

    if (Number(txParams.type) === 2) {
      payload.maxFeePerGas = hexlify(
        (txParams as IEIP1559TxParams).maxFeePerGas,
      );
      payload.maxPriorityFeePerGas = hexlify(
        (txParams as IEIP1559TxParams).maxPriorityFeePerGas,
      );
    } else {
      payload.gasPrice = hexlify((txParams as ILegacyTXParams).gasPrice);
    }

    const meta: ECA1TransactionMeta = {
      chainId: hexlify(txMeta.chainId),
      ...(txMeta.origin && { originUrl: txMeta.origin }),
      ...(txMeta.note && { note: txMeta.note }),
      ...(txMeta.transactionCategory && {
        transactionCategory: txMeta.transactionCategory,
      }),
    };

    const { result } = await this.#client.createTransaction([
      payload as ECA1TransactionParams,
      meta,
    ]);

    return {
      custodianTransactionId: result,
      transactionStatus: mapTransactionStatus('created'),
      from: accounts[0].address,
      custodianPublishesTransaction: true,
    };
  }

  async getTransaction(
    _from: string,
    custodianTransactionId: string,
  ): Promise<ITransactionDetails | null> {
    const { result } = await this.#client.getTransaction([
      custodianTransactionId,
    ]);

    if (!result) {
      return null;
    }

    return {
      transactionStatus: result.status,
      custodianTransactionId: result.id,
      from: result.from,
      gasLimit: result.gas ?? null,
      gasPrice: result.gasPrice ?? null,
      maxFeePerGas: result.maxFeePerGas ?? null,
      maxPriorityFeePerGas: result.maxPriorityFeePerGas ?? null,
      nonce: result.nonce,
      transactionHash: result.hash,
      reason: result.status.reason,
      to: result.to,
      custodianPublishesTransaction: true,
    };
  }

  // Gets a Signed Message by Id and returns relevant data
  async getSignedMessage(
    _address: string,
    custodianSignedMessageId: string,
  ): Promise<ISignedMessageDetails | null> {
    const { result } = await this.#client.getSignedMessage([
      custodianSignedMessageId,
    ]);

    if (!result) {
      return null;
    }

    return {
      id: custodianSignedMessageId,
      signature: result.signature,
      status: result.status,
    };
  }

  async getTransactionLink(
    transactionId: string,
  ): Promise<Partial<CustodianDeepLink> | null> {
    const { result } = await this.#client.getTransactionLink([transactionId]);

    if (!result) {
      return null;
    }

    return {
      id: transactionId,
      url: result.url,
      text: result.text,
      action: result.action,
      ethereum: result.ethereum ?? {
        accounts: [],
        chainId: [],
      },
    };
  }

  async getSignedMessageLink(
    signedMessageId: string,
  ): Promise<Partial<CustodianDeepLink> | null> {
    const { result } = await this.#client.getTransactionLink([signedMessageId]); // There was no getSignedMessageLink method in the original custodian API

    if (!result) {
      return null;
    }

    return {
      id: signedMessageId,
      url: result.url,
      text: result.text,
      action: result.action,
      ethereum: result.ethereum ?? {
        accounts: [],
        chainId: [],
      },
    };
  }

  // MMI Legacy feature that is not used in the custodial snap
  public async getCustomerProof(): Promise<string> {
    const { result } = await this.#client.getCustomerProof();
    return result.jwt;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async signTypedData_v4(
    address: string,
    message: TypedMessage<MessageTypes>,
    version: string,
    _signedTypedMessageMetadata: SignedTypedMessageMetadata,
  ): Promise<ISignedMessageDetails> {
    const accounts = await this.getEthereumAccountsByAddress(address);

    if (!accounts.length) {
      throw new Error('No such ethereum account!');
    }

    const normalizedVersion = version.toLowerCase();

    const { result } = await this.#client.signTypedData([
      address,
      message,
      normalizedVersion,
    ]);

    return {
      id: result,
      signature: null,
      status: mapTransactionStatus('created'),
      from: address,
    };
  }

  async signPersonalMessage(
    address: string,
    message: string,
    _signedMessageMetadata: SignedMessageMetadata,
  ): Promise<ISignedMessageDetails> {
    const accounts = await this.getEthereumAccountsByAddress(address);

    if (!accounts.length) {
      throw new Error('No such ethereum account!');
    }

    const { result } = await this.#client.signPersonalMessage([
      address,
      message,
    ]);

    return {
      id: result,
      status: mapTransactionStatus('created'),
      signature: null,
      from: address,
    };
  }

  async getSupportedChains(address: string): Promise<string[]> {
    return this.#cache.tryCaching<string[]>(
      `getSupportedChains-${address}`,
      this.#cacheAge,
      async () => {
        const { result } = await this.#client.getAccountChainIds([address]);
        return result;
      },
    );
  }

  changeRefreshTokenAuthDetails(authDetails: IRefreshTokenAuthDetails): void {
    this.#client.setRefreshToken(authDetails.refreshToken);
  }
}
