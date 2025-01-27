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
  SubmitRequestResponse,
  KeyringRequest,
} from '@metamask/keyring-api';
import { assert } from '@metamask/superstruct';
import { type Json } from '@metamask/utils';
import { v4 as uuid } from 'uuid';

import { TOKEN_EXPIRED_EVENT } from './lib/custodian-types/constants';
import { custodianMetadata } from './lib/custodian-types/custodianMetadata';
import { SignedMessageHelper } from './lib/helpers/signedmessage';
import { TransactionHelper } from './lib/helpers/transaction';
import { CreateAccountOptions } from './lib/structs/CustodialKeyringStructs';
import type {
  SignedMessageRequest,
  CustodialSnapRequest,
  TransactionRequest,
  OnBoardingRpcRequest,
} from './lib/structs/CustodialKeyringStructs';
import { KeyringRequestStruct } from './lib/structs/KeyringRequestStruct';
import type { CustodianDeepLink, IRefreshTokenChangeEvent } from './lib/types';
import type { KeyringState, Wallet } from './lib/types/CustodialKeyring';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import { CustodianApiMap } from './lib/types/CustodianType';
import type { EthSignTransactionRequest } from './lib/types/EthSignTransactionRequest';
import type { ICustodianApi } from './lib/types/ICustodianApi';
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
    const wallet = await this.getWallet(id);

    return wallet.account;
  }

  async accountExists(id: string): Promise<boolean> {
    return Object.keys(this.#state.wallets).includes(id);
  }

  async getWallet(id: string): Promise<Wallet> {
    const walletEntry = Object.entries(this.#state.wallets).find(
      ([key]) => key === id,
    );

    if (!walletEntry) {
      throwError(`Account '${id}' not found`);
    }

    return walletEntry[1];
  }

  async createAccount(
    options: CreateAccountOptions,
  ): Promise<CustodialKeyringAccount> {
    // @audit - runtime type validation superstruct.assert CreateAccountOptions (for all functions)

    assert(options, CreateAccountOptions);

    // Try to get the options from the custodian metadata
    const custodian = custodianMetadata.find(
      (item) => item.apiBaseUrl === options.details.custodianApiUrl,
    );

    const { address, name } = options; // @audit input val

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
        // @audit - sequence of events? update wallet first, then emit?
        account,
        accountNameSuggestion: name ?? 'Custodial Account',
        displayConfirmation: false, // This will only work when the snap is preinstalled
      });
      this.#state.wallets[account.id] = { account, details: options.details }; // @audit - race?
      await this.#saveState();
      return account; // @audit race
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
      this.#state.wallets[account.id] ?? // @audit may return type Record builtins 'toString' and ?? would eval true;
      throwError(`Account '${account.id}' not found`);
    // @audit - who can update the account?
    const newAccount: CustodialKeyringAccount = {
      ...wallet.account,
      ...account, // @audit unsafe override! - runtime input validation. might include extra fields. might override field
      // Restore read-only properties.
      address: wallet.account.address,
      options: { ...wallet.account.options, ...account.options }, // @audit preserves original options. however, this will become increasingly hard to handle with multiple updates as prevs. account.options must always persist and they are silently overwritten. better to pick and allow what options to override. dont use spread syntax to overwrite things generally because unsafe/sideffects
    }; // @audit should this allow user to set fields that they cannot during creataccount? specify what can be updated safely, else preserve default fields

    try {
      await this.#emitEvent(KeyringEvent.AccountUpdated, {
        // @audit sequence of events; emit before savestate? race
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
      await this.#emitEvent(KeyringEvent.AccountDeleted, { id }); // @audit seq of events
      delete this.#state.wallets[id]; // @audit might delete record functions; unsafe
      await this.#saveState();
    } catch (error) {
      throwError((error as Error).message);
    }
  }

  async removeAccounts(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => delete this.#state.wallets[id])); // @audit - unsafe, see deleteaccount
    await this.#saveState(); // @audit - does not emit event? whats the diff to deleteAccount?
  }

  // Maintain compatibility with the keyring api
  async listRequests(): Promise<KeyringRequest[]> {
    const requests = await this.#requestManagerFacade.listRequests();
    return requests.map((request) => request.keyringRequest); // @audit - allows any origin to get all other requests! only return this origin requests
  }

  // Maintain compatibility with the keyring api
  async getRequest(id: string): Promise<KeyringRequest> {
    // @audit input val
    const requests = await this.#requestManagerFacade.listRequests();
    const request = requests.find((req) => req.keyringRequest.id === id);
    if (!request) {
      throw new Error(`Request '${id}' not found`);
    } // @audit only return request created by origin
    return request.keyringRequest;
  }

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    return this.#asyncSubmitRequest(request); // @audit input val
  }

  // Don't allow approving requests from the keyring api
  async approveRequest(_id: string): Promise<void> {
    throw new Error('Method not implemented.'); // @audit remove from initial permissions?
  }

  // Don't allow rejecting requests from the keyring api
  async rejectRequest(_id: string): Promise<void> {
    throw new Error('Method not implemented.'); // @audit remove from initial permissions?
  }

  getCustodianApiForAddress(address: string): ICustodianApi {
    if (!this.#custodianApi[address]) {
      const wallet = this.#getWalletByAddress(address);
      const custodianApi = this.#getCustodianApi(wallet.details);
      this.#custodianApi[address] = custodianApi;
      custodianApi.on(
        TOKEN_EXPIRED_EVENT,
        (payload: IRefreshTokenChangeEvent) => {
          this.#handleTokenChangedEvent(payload).catch(console.error); // @audit - infoleak console
        },
      );
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

  async #handleTokenChangedEvent(
    payload: IRefreshTokenChangeEvent,
  ): Promise<void> {
    // Find all the wallets with the old refresh token
    const wallets = Object.values(this.#state.wallets).filter(
      (wallet) =>
        wallet.details.token === payload.oldRefreshToken &&
        wallet.details.custodianApiUrl === payload.apiUrl,
    );
    // Update the custodian api for each wallet
    wallets.forEach((wallet) => {
      wallet.details.token = payload.newRefreshToken;
    });

    // Delete the custodian api from the cache for each address
    wallets.forEach((wallet) => {
      delete this.#custodianApi[wallet.account.address];
    });

    await this.#saveState();
  }

  async #asyncSubmitRequest(
    request: KeyringRequest, // @audit runtime input val; type enforcement
  ): Promise<SubmitRequestResponse> {
    assert(request, KeyringRequestStruct);

    const custodianId = await this.#handleSigningRequest(
      request.request.method,
      request.request.params ?? [],
      request,
    );

    const { address } = await this.getAccount(request.account); // @audit verify account exists

    // Distinguish between a transaction link and a message link

    let deepLink: CustodianDeepLink | null = null;

    try {
      if (request.request.method === EthMethod.SignTransaction) {
        deepLink = (await this.getCustodianApiForAddress(
          address,
        ).getTransactionLink(custodianId)) as CustodianDeepLink;
      } else {
        // @audit - explicitly check for methods in account config; throw methodNotFound if not exists
        deepLink = (await this.getCustodianApiForAddress(
          address,
        ).getSignedMessageLink(custodianId)) as CustodianDeepLink;
      }
    } catch (error) {
      deepLink = {
        text: 'Complete in Custodian App',
        id: custodianId,
        url: '',
        action: 'view',
      };
      console.error('Error getting deep link', error);
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
    switch (
      method // @audit input validation
    ) {
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
    // @audit input validation
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
    // @audit-ok
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(snap, event, data);
  }
}
