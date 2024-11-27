import type { MessageTypes, TypedMessage } from '@metamask/eth-sig-util';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';
import type {
  Keyring,
  KeyringRequest,
  SubmitRequestResponse,
} from '@metamask/keyring-api';
import {
  EthAccountType,
  EthMethod,
  emitSnapKeyringEvent,
} from '@metamask/keyring-api';
import { KeyringEvent } from '@metamask/keyring-api/dist/events';
import { type Json } from '@metamask/utils';
import { v4 as uuid } from 'uuid';

import { DeepLink } from './components/DeepLink';
import { ERROR_MESSAGES } from './lib/constants';
import { custodianMetadata } from './lib/custodian-types/custodianMetadata';
import { SignatureHandler } from './lib/handlers/signature';
import { TransactionHandler } from './lib/handlers/transaction';
import type { CustodianDeepLink } from './lib/types';
import type {
  KeyringState,
  Wallet,
  CreateAccountOptions,
} from './lib/types/CustodialKeyring';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import { AuthTypeMap, CustodianApiMap } from './lib/types/CustodianType';
import type { ICustodianApi } from './lib/types/ICustodianApi';
import type { ITransactionDetails } from './lib/types/ITransactionDetails';
import type { OnBoardingRpcRequest } from './lib/types/OnBoardingRpcRequest';
import { RequestManager } from './requestsManager';
import { saveState } from './stateManagement';
import {
  isUniqueAddress,
  throwError,
  createCommon,
  convertHexChainIdToCaip2Decimal,
} from './util';

export class CustodialKeyring implements Keyring {
  #state: KeyringState;

  #custodianApi: Record<string, ICustodianApi>; // maps address to memoized custodian api

  #transactionHandler: TransactionHandler;

  #signatureHandler: SignatureHandler;

  #requestManager: RequestManager;

  removePendingSignMessage: (id?: string) => Promise<void>;

  constructor(state: KeyringState) {
    this.#state = state;
    this.#custodianApi = {};
    this.#transactionHandler = new TransactionHandler();
    this.#signatureHandler = new SignatureHandler(state);
    this.#requestManager = new RequestManager(state);

    this.removePendingSignMessage =
      this.#signatureHandler.removePendingSignMessage.bind(
        this.#signatureHandler,
      );
  }

  async listAccounts(): Promise<CustodialKeyringAccount[]> {
    return Object.values(this.#state.wallets).map((wallet) => wallet.account);
  }

  async getAccount(id: string): Promise<CustodialKeyringAccount> {
    return (
      this.#state.wallets[id]?.account ??
      throwError(`Account '${id}' not found`)
    );
  }

  async accountExists(id: string): Promise<boolean> {
    return this.#state.wallets[id] !== undefined;
  }

  async createAccount(
    options: CreateAccountOptions,
  ): Promise<CustodialKeyringAccount> {
    // Try to get the options from the custodian metadata
    const custodian = custodianMetadata.find(
      (item) => item.apiBaseUrl === options.details.custodianApiUrl,
    );

    const { address, name } = options;

    if (!isUniqueAddress(address, Object.values(this.#state.wallets))) {
      throw new Error(`Account address already in use: ${address}`);
    }

    try {
      const account: CustodialKeyringAccount = {
        id: uuid(),
        options: {
          custodian: {
            displayName: options.details.custodianDisplayName,
            deferPublication: custodian?.custodianPublishesTransaction ?? true,
          },
        },
        address,
        methods: [
          EthMethod.SignTransaction,
          EthMethod.PersonalSign,
          EthMethod.SignTypedDataV3,
          EthMethod.SignTypedDataV4,
        ],
        type: EthAccountType.Eoa,
      };
      await this.#emitEvent(KeyringEvent.AccountCreated, {
        account,
        accountNameSuggestion: name ?? 'Custodial Account',
        displayConfirmation: false, // This will only work when the snap is preinstalled
      });
      this.#state.wallets[account.id] = { account, details: options.details };
      await this.#saveState();
      return account;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    const { address } = await this.getAccount(id);
    const custodianApi = this.getCustodianApiForAddress(address);
    const supportedChains = await custodianApi.getSupportedChains();
    return chains.filter((chain) =>
      supportedChains.includes(convertHexChainIdToCaip2Decimal(chain)),
    );
  }

  async updateAccount(account: CustodialKeyringAccount): Promise<void> {
    const wallet =
      this.#state.wallets[account.id] ??
      throwError(`Account '${account.id}' not found`);

    const newAccount: CustodialKeyringAccount = {
      ...wallet.account,
      ...account,
      // Restore read-only properties.
      address: wallet.account.address,
      options: { ...wallet.account.options, ...account.options },
    };

    try {
      await this.#emitEvent(KeyringEvent.AccountUpdated, {
        account: newAccount,
      });
      wallet.account = newAccount;
      await this.#saveState();
    } catch (error) {
      throwError((error as Error).message);
    }
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await this.#emitEvent(KeyringEvent.AccountDeleted, { id });
      delete this.#state.wallets[id];
      await this.#saveState();
    } catch (error) {
      throwError((error as Error).message);
    }
  }

  listPendingRequests(): KeyringRequest[] {
    return Object.values(this.#state.pendingRequests);
  }

  listPendingTransactions() {
    return this.#state.pendingTransactions
      ? Object.keys(this.#state.pendingTransactions).map((key) => ({
          ...(this.#state.pendingTransactions[key] as ITransactionDetails),
          requestId: key,
        }))
      : [];
  }

  async updatePendingTransaction(
    id: string,
    transaction: ITransactionDetails,
  ): Promise<string> {
    const transactionKey = Object.keys(this.#state.pendingTransactions).find(
      (key) =>
        (this.#state.pendingTransactions[key] as ITransactionDetails)
          .custodianTransactionId === id,
    );
    if (!transactionKey) {
      throw new Error(`Transaction '${id}' not found`);
    }
    if (!transaction) {
      throw new Error('Transaction is required');
    }

    this.#state.pendingTransactions[transactionKey] = transaction;
    await this.#saveState();

    return transactionKey;
  }

  listPendingSignMessages(): {
    requestId: string;
    id: string | undefined;
  }[] {
    return this.#state.pendingSignMessages
      ? Object.keys(this.#state.pendingSignMessages).map((key) => ({
          requestId: key,
          id: this.#state.pendingSignMessages[key] as string,
        }))
      : [];
  }

  async updatePendingSignature(id: string, signature: string): Promise<string> {
    const messageKey = Object.keys(this.#state.pendingSignMessages).find(
      (key) => this.#state.pendingSignMessages[key] === id,
    );
    if (!messageKey) {
      throw new Error(`Message '${id}' not found`);
    }
    this.#state.pendingSignMessages[messageKey] = signature;
    await this.#saveState();

    return messageKey;
  }

  async listRequests(): Promise<KeyringRequest[]> {
    return Object.values(this.#state.pendingRequests);
  }

  async getRequest(id: string): Promise<KeyringRequest> {
    return (
      this.#state.pendingRequests[id] ?? throwError(`Request '${id}' not found`)
    );
  }

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    return this.#asyncSubmitRequest(request);
  }

  async approveRequest(id: string): Promise<void> {
    if (!this.#state.pendingRequests[id]) {
      throwError(ERROR_MESSAGES.REQUEST_NOT_FOUND(id));
    }

    await this.#requestManager.processPendingRequest(id, {
      processTransaction: this.#processTransactionRequest.bind(this),
      processSignature: this.#processSignatureRequest.bind(this),
      emitEvent: this.#emitEvent.bind(this),
    });
    await this.#requestManager.removePendingRequest(id);
  }

  async rejectRequest(id: string): Promise<void> {
    if (this.#state.pendingRequests[id] === undefined) {
      throw new Error(`Request '${id}' not found`);
    }

    await this.#requestManager.removePendingRequest(id);
    await this.#emitEvent(KeyringEvent.RequestRejected, { id });
  }

  getCustodianApiForAddress(address: string): ICustodianApi {
    if (!this.#custodianApi[address]) {
      const wallet = this.#getWalletByAddress(address);
      const custodianApi = this.#getCustodianApi(wallet.details);
      this.#custodianApi[address] = custodianApi;
    }
    return this.#custodianApi[address];
  }

  #getCustodianApi(details: OnBoardingRpcRequest): ICustodianApi {
    const CustodianApiClass = CustodianApiMap[details.custodianType];
    const authType = AuthTypeMap[details.custodianType];

    const custodianApi = new CustodianApiClass(
      { refreshToken: details.token, refreshTokenUrl: details.refreshTokenUrl },
      authType,
      details.custodianApiUrl,
      1000,
    );
    return custodianApi;
  }

  async removePendingTransaction(id?: string): Promise<void> {
    if (!id || !this.#state.pendingTransactions[id]) {
      return;
    }
    delete this.#state.pendingTransactions[id];
    await this.#saveState();
  }

  async #asyncSubmitRequest(
    request: KeyringRequest,
  ): Promise<SubmitRequestResponse> {
    this.#state.pendingRequests[request.id] = request;

    const result = await this.#handleSigningRequest(
      request.request.method,
      request.request.params ?? [],
      request.id,
    );

    const { address, options } = await this.getAccount(request.account);

    // Distinguish between a transaction link and a message link

    let deepLink: CustodianDeepLink | null = null;

    let requestTypeDisplayName: string | null = null;

    if (request.request.method === EthMethod.SignTransaction) {
      deepLink = (await this.getCustodianApiForAddress(
        address,
      ).getTransactionLink(result as string)) as CustodianDeepLink;
      requestTypeDisplayName = 'transaction';
    } else {
      deepLink = (await this.getCustodianApiForAddress(
        address,
      ).getSignedMessageLink(result as string)) as CustodianDeepLink;
      requestTypeDisplayName = 'signed message';
    }

    await snap.request({
      method: 'snap_dialog',
      params: {
        content: (
          <DeepLink
            custodianDeepLink={deepLink}
            options={options}
            requestTypeDisplayName={requestTypeDisplayName}
          />
        ),
      },
    });

    return {
      pending: true,
    };
  }

  #getWalletByAddress(address: string): Wallet {
    const match = Object.values(this.#state.wallets).find(
      (wallet) =>
        wallet.account.address.toLowerCase() === address.toLowerCase(),
    );

    return match ?? throwError(`Account '${address}' not found`);
  }

  async #handleSigningRequest(
    method: string,
    params: Json,
    requestId: string,
  ): Promise<Json> {
    switch (method) {
      case EthMethod.PersonalSign: {
        const [message, from] = params as [string, string];
        const custodianApi = this.getCustodianApiForAddress(from);
        this.#state.pendingSignMessages[requestId] = message;
        await this.#saveState();
        return await this.#signatureHandler.signPersonalMessage(
          from,
          message,
          requestId,
          custodianApi,
        );
      }

      case EthMethod.SignTransaction: {
        const [tx] = params as [any];
        return this.#signTransaction(tx, requestId);
      }

      case EthMethod.SignTypedDataV3: {
        const [from, data] = params as [string, TypedMessage<MessageTypes>];
        const custodianApi = this.getCustodianApiForAddress(from);
        this.#state.pendingSignMessages[requestId] = data;
        await this.#saveState();
        return this.#signatureHandler.signTypedData(
          from,
          data,
          requestId,
          custodianApi,
          { version: SignTypedDataVersion.V3 },
        );
      }

      case EthMethod.SignTypedDataV4: {
        const [from, data] = params as [string, TypedMessage<MessageTypes>];
        const custodianApi = this.getCustodianApiForAddress(from);
        this.#state.pendingSignMessages[requestId] = data;
        await this.#saveState();
        return this.#signatureHandler.signTypedData(
          from,
          data,
          requestId,
          custodianApi,
          { version: SignTypedDataVersion.V4 },
        );
      }

      default: {
        throw new Error(`EVM method '${method}' not supported`);
      }
    }
  }

  async #signTransaction(tx: any, requestId: string): Promise<string> {
    try {
      const custodianApi = this.getCustodianApiForAddress(tx.from);
      const payload = this.#transactionHandler.createTransactionPayload(tx);
      const wallet = this.#getWalletByAddress(tx.from);

      const custodianPublishesTransaction =
        wallet.account.options.custodian.deferPublication;

      const response = await custodianApi.createTransaction(payload, {
        chainId: tx.chainId,
        custodianPublishesTransaction,
      });

      await this.#savePendingTransaction(requestId, {
        ...payload,
        custodianTransactionId: response.custodianTransactionId,
      });

      return response.custodianTransactionId;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw new Error(
        `Failed to sign transaction: ${(error as Error).message}`,
      );
    }
  }

  async #processTransactionRequest(
    pendingRequest: ITransactionDetails,
  ): Promise<{ v: string; r: string; s: string }> {
    const common = createCommon(pendingRequest);

    return this.#transactionHandler.getTransactionSignature(
      common,
      pendingRequest,
    );
  }

  async #processSignatureRequest(id: string): Promise<any> {
    const message = this.#state.pendingSignMessages[id];
    delete this.#state.pendingSignMessages[id];
    return message;
  }

  async #savePendingTransaction(
    requestId: string,
    transaction: any,
  ): Promise<void> {
    this.#state.pendingTransactions[requestId] = transaction;
    await this.#saveState();
  }

  async #saveState(): Promise<void> {
    await saveState(this.#state);
  }

  async #emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(snap, event, data);
  }
}
