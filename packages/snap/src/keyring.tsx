import type { MessageTypes, TypedMessage } from '@metamask/eth-sig-util';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';
import {
  emitSnapKeyringEvent,
  EthAccountType,
  EthMethod,
  KeyringEvent,
} from '@metamask/keyring-api';
import type {
  Keyring,
  KeyringRequest,
  SubmitRequestResponse,
} from '@metamask/keyring-api';
import { type Json } from '@metamask/utils';
import { v4 as uuid } from 'uuid';

import { custodianMetadata } from './lib/custodian-types/custodianMetadata';
import { SignedMessageHelper } from './lib/helpers/signedmessage';
import { TransactionHelper } from './lib/helpers/transaction';
import type { CustodianDeepLink } from './lib/types';
import type {
  KeyringState,
  Wallet,
  CreateAccountOptions,
  CustodialSnapRequest,
  SignedMessageRequest,
  TransactionRequest,
} from './lib/types/CustodialKeyring';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import { CustodianApiMap } from './lib/types/CustodianType';
import type { EthSignTransactionRequest } from './lib/types/EthSignTransactionRequest';
import type { ICustodianApi } from './lib/types/ICustodianApi';
import type { OnBoardingRpcRequest } from './lib/types/OnBoardingRpcRequest';
import { saveState } from './stateManagement';
import {
  isUniqueAddress,
  throwError,
  convertHexChainIdToCaip2Decimal,
} from './util';

type RequestManagerFacade = {
  addPendingRequest: (
    request: CustodialSnapRequest<SignedMessageRequest | TransactionRequest>,
  ) => Promise<void>;
  listRequests: () => Promise<
    CustodialSnapRequest<SignedMessageRequest | TransactionRequest>[]
  >;
};

export class CustodialKeyring implements Keyring {
  #state: KeyringState;

  #custodianApi: Record<string, ICustodianApi>; // maps address to memoized custodian api

  #requestManagerFacade: RequestManagerFacade;

  constructor(state: KeyringState, requestManagerFacade: RequestManagerFacade) {
    this.#state = state;
    this.#custodianApi = {};
    this.#requestManagerFacade = requestManagerFacade;
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
          accountName: name,
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

  async removeAccounts(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => delete this.#state.wallets[id]));
    await this.#saveState();
  }

  // Maintain compatibility with the keyring api
  async listRequests(): Promise<KeyringRequest[]> {
    const requests = await this.#requestManagerFacade.listRequests();
    return requests.map((request) => request.keyringRequest);
  }

  // Maintain compatibility with the keyring api
  async getRequest(id: string): Promise<KeyringRequest> {
    const requests = await this.#requestManagerFacade.listRequests();
    const request = requests.find((req) => req.keyringRequest.id === id);
    if (!request) {
      throw new Error(`Request '${id}' not found`);
    }
    return request.keyringRequest;
  }

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    return this.#asyncSubmitRequest(request);
  }

  // Don't allow approving requests from the keyring api
  async approveRequest(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // Don't allow rejecting requests from the keyring api
  async rejectRequest(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getCustodianApiForAddress(address: string): ICustodianApi {
    if (!this.#custodianApi[address]) {
      const wallet = this.#getWalletByAddress(address);
      const custodianApi = this.#getCustodianApi(wallet.details);
      this.#custodianApi[address] = custodianApi;
    }
    return this.#custodianApi[address] as ICustodianApi;
  }

  #getCustodianApi(details: OnBoardingRpcRequest): ICustodianApi {
    const CustodianApiClass = CustodianApiMap[details.custodianType];

    const custodianApi = new CustodianApiClass(
      { refreshToken: details.token, refreshTokenUrl: details.refreshTokenUrl },
      details.custodianApiUrl,
      1000,
    );
    return custodianApi;
  }

  async #asyncSubmitRequest(
    request: KeyringRequest,
  ): Promise<SubmitRequestResponse> {
    const custodianId = await this.#handleSigningRequest(
      request.request.method,
      request.request.params ?? [],
      request,
    );

    const { address } = await this.getAccount(request.account);

    // Distinguish between a transaction link and a message link

    let deepLink: CustodianDeepLink | null = null;

    if (request.request.method === EthMethod.SignTransaction) {
      deepLink = (await this.getCustodianApiForAddress(
        address,
      ).getTransactionLink(custodianId)) as CustodianDeepLink;
    } else {
      deepLink = (await this.getCustodianApiForAddress(
        address,
      ).getSignedMessageLink(custodianId)) as CustodianDeepLink;
    }

    return {
      pending: true,
      redirect: {
        message: deepLink.text,
        url: deepLink.url,
      },
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
    keyringRequest: KeyringRequest,
  ): Promise<string> {
    switch (method) {
      case EthMethod.PersonalSign: {
        const [message, from] = params as [string, string];
        const custodianApi = this.getCustodianApiForAddress(from);

        const details = await SignedMessageHelper.signPersonalMessage(
          from,
          message,
          custodianApi,
        );

        await this.#requestManagerFacade.addPendingRequest({
          keyringRequest,
          type: 'message',
          subType: 'personalSign',
          fulfilled: false,
          rejected: false,
          message: details,
          signature: null,
        });
        return details.id;
      }

      case EthMethod.SignTransaction: {
        const [tx] = params as [EthSignTransactionRequest];
        const result = await this.#signTransaction(tx, keyringRequest);
        return result;
      }

      case EthMethod.SignTypedDataV3: {
        const [from, data] = params as [string, TypedMessage<MessageTypes>];
        const custodianApi = this.getCustodianApiForAddress(from);
        const details = await SignedMessageHelper.signTypedData(
          from,
          data,
          custodianApi,
          { version: SignTypedDataVersion.V3 },
        );
        await this.#requestManagerFacade.addPendingRequest({
          keyringRequest,
          type: 'message',
          subType: 'v3',
          fulfilled: false,
          rejected: false,
          message: details,
          signature: null,
        });
        return details.id;
      }

      case EthMethod.SignTypedDataV4: {
        const [from, data] = params as [string, TypedMessage<MessageTypes>];
        const custodianApi = this.getCustodianApiForAddress(from);
        const details = await SignedMessageHelper.signTypedData(
          from,
          data,
          custodianApi,
          { version: SignTypedDataVersion.V3 },
        );
        await this.#requestManagerFacade.addPendingRequest({
          keyringRequest,
          type: 'message',
          subType: 'v4',
          fulfilled: false,
          rejected: false,
          message: details,
          signature: null,
        });
        return details.id;
      }

      default: {
        throw new Error(`EVM method '${method}' not supported`);
      }
    }
  }

  async #signTransaction(
    tx: EthSignTransactionRequest,
    keyringRequest: KeyringRequest,
  ): Promise<string> {
    try {
      const custodianApi = this.getCustodianApiForAddress(tx.from);
      const payload = TransactionHelper.createTransactionPayload(tx);
      const wallet = this.#getWalletByAddress(tx.from);

      const custodianPublishesTransaction =
        wallet.account.options.custodian.deferPublication;

      const response = await custodianApi.createTransaction(payload, {
        chainId: tx.chainId,
        custodianPublishesTransaction,
      });

      await this.#requestManagerFacade.addPendingRequest({
        keyringRequest,
        type: 'transaction',
        fulfilled: false,
        rejected: false,
        transaction: response,
        signature: null,
      });

      return response.custodianTransactionId;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw new Error(
        `Failed to sign transaction: ${(error as Error).message}`,
      );
    }
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
