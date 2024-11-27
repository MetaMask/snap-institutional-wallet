import { EventEmitter } from 'events';

import { ECA3Client } from './ECA3Client';
import { hexlify } from '../../../util/hexlify';
import { mapTransactionStatus } from '../../../util/map-status';
import { SimpleCache } from '../../simple-cache';
import type {
  IApiCallLogEntry,
  ICustodianApi,
  CustodianDeepLink,
  IEIP1559TxParams,
  IEthereumAccount,
  IEthereumAccountCustodianDetails,
  ILegacyTXParams,
  IRefreshTokenAuthDetails,
  ISignedMessageDetails,
  ITransactionDetails,
  SignedMessageMetadata,
  SignedTypedMessageMetadata,
} from '../../types';
import type {
  ECA3TransactionMeta,
  ECA3TransactionParams,
} from './rpc-payloads/ECA3CreateTransactionPayload';
import type {
  ECA3ReplaceTransactionGasParams,
  ECA3ReplaceTransactionParams,
} from './rpc-payloads/ECA3ReplaceTransactionPayload';
import type { CreateTransactionMetadata } from '../../types/CreateTransactionMetadata';
import type { MessageTypes, TypedMessage } from '../../types/ITypedMessage';
import type { ReplaceTransactionParams } from '../../types/ReplaceTransactionParams';
import {
  API_REQUEST_LOG_EVENT,
  INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT,
  REFRESH_TOKEN_CHANGE_EVENT,
} from '../constants';

export class ECA3CustodianApi extends EventEmitter implements ICustodianApi {
  #client: ECA3Client;

  #cache = new SimpleCache();

  #cacheAge: number;

  constructor(
    authDetails: IRefreshTokenAuthDetails,
    apiUrl: string,
    cacheAge: number,
  ) {
    super();
    const { refreshToken } = authDetails;
    this.#client = new ECA3Client(
      apiUrl,
      refreshToken,
      authDetails.refreshTokenUrl,
    );

    this.#cacheAge = cacheAge;

    // This event is "bottom up" - from the custodian via the client.
    // Just bubble it up to MMISDK

    this.#client.on(REFRESH_TOKEN_CHANGE_EVENT, (event) => {
      this.emit(REFRESH_TOKEN_CHANGE_EVENT, event);
    });

    this.#client.on(INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT, (event) => {
      this.emit(INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT, event);
    });

    this.#client.on(API_REQUEST_LOG_EVENT, (event: IApiCallLogEntry) => {
      this.emit(API_REQUEST_LOG_EVENT, event);
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
      metadata: account.metadata,
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

  // MMI Legacy feature that is n ot used in the custodial snap
  async getListAccountsSigned(): Promise<string> {
    const { result } = await this.#client.listAccountsSigned();

    return result.jwt;
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
    const fromAddress = txParams.from;

    const accounts = await this.getEthereumAccountsByAddress(fromAddress);

    if (!accounts.length || !accounts[0]?.address) {
      throw new Error('No such ethereum account!');
    }

    const payload: Partial<ECA3TransactionParams> = {
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

    const meta: ECA3TransactionMeta = {
      chainId: hexlify(txMeta.chainId),
      ...(txMeta.origin && { originUrl: txMeta.origin }),
      ...(txMeta.note && { note: txMeta.note }),
      ...(txMeta.transactionCategory && {
        transactionCategory: txMeta.transactionCategory,
      }),
      ...(typeof txMeta.custodianPublishesTransaction === 'boolean' && {
        custodianPublishesTransaction: txMeta.custodianPublishesTransaction,
      }),
      ...(txMeta.rpcUrl && { rpcUrl: txMeta.rpcUrl }), // MMI Legacy feature that is  not used in the custodial snap
    };

    const { result } = await this.#client.createTransaction([
      payload as ECA3TransactionParams,
      meta,
    ]);

    return {
      custodianTransactionId: result,
      transactionStatus: mapTransactionStatus('created'),
      from: accounts[0].address,
      custodianPublishesTransaction: txMeta.custodianPublishesTransaction,
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
      transactionStatus: result.transaction.status,
      transactionStatusDisplayText: result.transaction.status?.displayText,
      custodianTransactionId: result.transaction.id,
      from: result.transaction.from,
      gasLimit: result.transaction.gas ?? null,
      gasPrice: result.transaction.gasPrice ?? null,
      maxFeePerGas: result.transaction.maxFeePerGas ?? null,
      maxPriorityFeePerGas: result.transaction.maxPriorityFeePerGas ?? null,
      nonce: result.transaction.nonce,
      transactionHash: result.transaction.hash,
      reason: result.transaction.status.reason,
      to: result.transaction.to,
      signedRawTransaction: result.transaction.signedRawTransaction ?? null,
      chainId: result.metadata?.chainId ?? null,
      custodianPublishesTransaction:
        result.metadata?.custodianPublishesTransaction ?? true,
      rpcUrl: result.metadata?.rpcUrl ?? null,
    };
  }

  // MMI Legacy feature that is  not used in the custodial snap
  async replaceTransaction(
    txParams: ReplaceTransactionParams,
  ): Promise<{ transactionId: string }> {
    const payload: Partial<ECA3ReplaceTransactionParams> = {
      transactionId: txParams.transactionId,
      action: txParams.action,
    };

    const gasParams: Partial<ECA3ReplaceTransactionGasParams> = {};

    if (txParams.gasLimit) {
      gasParams.gas = hexlify(txParams.gasLimit);
    }

    if (txParams.maxPriorityFeePerGas) {
      gasParams.maxPriorityFeePerGas = hexlify(txParams.maxPriorityFeePerGas);
    }

    if (txParams.maxFeePerGas) {
      gasParams.maxFeePerGas = hexlify(txParams.maxFeePerGas);
    }

    const { result } = await this.#client.replaceTransaction([
      payload as ECA3ReplaceTransactionParams,
      gasParams as ECA3ReplaceTransactionGasParams,
    ]);

    return {
      transactionId: result.transactionId,
    };
  }

  // Gets a Signed Message by I d and returns relevant data
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
    const { result } = await this.#client.getSignedMessageLink([
      signedMessageId,
    ]);

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
    data: TypedMessage<MessageTypes>,
    version: string,
    signedTypedMessageMetadata: SignedTypedMessageMetadata,
  ): Promise<ISignedMessageDetails> {
    const accounts = await this.getEthereumAccountsByAddress(address);

    if (!accounts.length) {
      throw new Error('No such ethereum account!');
    }

    const normalizedVersion = version.toLowerCase();

    const { result } = await this.#client.signTypedData([
      {
        address,
        data,
        version: normalizedVersion,
      },
      signedTypedMessageMetadata,
    ]);

    return {
      id: result,
      status: mapTransactionStatus('created'),
      signature: null,
      from: address,
    };
  }

  async signPersonalMessage(
    address: string,
    message: string,
    signedMessageMetadata: SignedMessageMetadata,
  ): Promise<ISignedMessageDetails> {
    const accounts = await this.getEthereumAccountsByAddress(address);

    if (!accounts.length) {
      throw new Error('No such ethereum account!');
    }

    const { result } = await this.#client.signPersonalMessage([
      {
        address,
        message,
      },
      signedMessageMetadata,
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
