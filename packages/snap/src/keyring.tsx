import { toChecksumAddress } from '@ethereumjs/util';
import type { MessageTypes, TypedMessage } from '@metamask/eth-sig-util';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';
import type {
  Keyring,
  KeyringRequest,
  SubmitRequestResponse,
} from '@metamask/keyring-api';
import {
  emitSnapKeyringEvent,
  EthAccountType,
  EthMethod,
  KeyringEvent,
  KeyringRequestStruct,
} from '@metamask/keyring-api';
import { MethodNotFoundError } from '@metamask/snaps-sdk';
import { assert, string } from '@metamask/superstruct';
import { type Json } from '@metamask/utils';
import { v4 as uuid } from 'uuid';

import config from './config';
import { renderInfoMessage } from './features/info-message/rendex';
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
  ConnectionStatusRpcRequest,
} from './lib/structs/CustodialKeyringStructs';
import type { CustodianDeepLink, IRefreshTokenChangeEvent } from './lib/types';
import type { CustodialKeyringAccount } from './lib/types/CustodialKeyringAccount';
import { CustodianApiMap } from './lib/types/CustodianType';
import type { EthSignTransactionRequest } from './lib/types/EthSignTransactionRequest';
import type { ICustodianApi } from './lib/types/ICustodianApi';
import logger from './logger';
import type { KeyringStateManager } from './stateManagement';
import { throwError } from './util';
import { convertHexChainIdToCaip2Decimal } from './util/convert-hex-chain-id-to-caip2-decimal';
import { isUniqueAddress } from './util/is-unique-address';
import { runSensitive } from './util/run-sensitive';

type RequestManagerFacade = {
  upsertRequest: (
    request: CustodialSnapRequest<SignedMessageRequest | TransactionRequest>,
  ) => Promise<void>;
  listRequests: () => Promise<
    CustodialSnapRequest<SignedMessageRequest | TransactionRequest>[]
  >;
};

export class CustodialKeyring implements Keyring {
  #custodianApi: Map<string, ICustodianApi>;

  #requestManagerFacade: RequestManagerFacade;

  #stateManager: KeyringStateManager;

  constructor(
    stateManager: KeyringStateManager,
    requestManagerFacade: RequestManagerFacade,
  ) {
    this.#stateManager = stateManager;
    this.#custodianApi = new Map<string, ICustodianApi>();
    this.#requestManagerFacade = requestManagerFacade;
  }

  async listAccounts(): Promise<CustodialKeyringAccount[]> {
    return this.#stateManager.listAccounts();
  }

  async getAccount(id: string): Promise<CustodialKeyringAccount | undefined> {
    return (await this.#stateManager.getAccount(id)) ?? undefined;
  }

  // NB: external input
  async createAccount(
    options: CreateAccountOptions,
  ): Promise<CustodialKeyringAccount> {
    assert(options, CreateAccountOptions);

    // Try to get the options from the custodian metadata
    const custodian = custodianMetadata.find(
      (item) => item.apiBaseUrl === options.details.custodianApiUrl,
    );

    let custodianEnvironmentName: string;
    let custodianEnvironmentDisplayName: string;

    // If dev mode is enabled, trust the custodian info from the onboarding request

    if (config.dev) {
      custodianEnvironmentName = options.details.custodianEnvironment;
      custodianEnvironmentDisplayName = options.details.custodianDisplayName;
    } else {
      // Otherwise, use the custodian info from the custodian metadata
      // and if it's not found, throw an error
      if (!custodian) {
        throw new Error(
          `No custodian allowlisted for API URL: ${options.details.custodianApiUrl}`,
        );
      }
      custodianEnvironmentName = custodian.name;
      custodianEnvironmentDisplayName = options.details.custodianDisplayName;
    }

    const { address, name } = options;

    const wallets = await this.#stateManager.listWallets();

    if (!isUniqueAddress(address, wallets)) {
      throw new Error(`Account address already in use: ${address}`);
    }

    // Some custodians (mostly ECA-1) still publish transactions
    // If the custodian publishes transactions, we defer publication
    // i.e. the client does not publish the transaction, it waits for the custodian to do it

    let deferPublication = false; // ECA-3 default

    if (custodian?.custodianPublishesTransaction) {
      deferPublication = true;
    }

    try {
      const account: CustodialKeyringAccount = {
        id: uuid(),
        options: {
          custodian: {
            environmentName: custodianEnvironmentName,
            displayName: custodianEnvironmentDisplayName,
            deferPublication,
            importOrigin: options.origin,
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

      // This event actually *asks* the client to create the account
      // If the client adds it, the account is now in the client and we should
      // reflect it in the snap state
      // If the client does not accept it, the following code is not reached
      await this.#emitEvent(KeyringEvent.AccountCreated, {
        account,
        accountNameSuggestion: name ?? 'Custodial Account',
        displayConfirmation: false, // This will only work when the snap is preinstalled
        displayAccountNameSuggestion: false,
      });
      await this.#stateManager.addWallet({ account, details: options.details });
      return account;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  async filterAccountChains(id: string, chains: string[]): Promise<string[]> {
    const account = await this.getAccount(id);

    if (!account) {
      throw new Error(`Account '${id}' not found`);
    }

    const custodianApi = await this.getCustodianApiForAddress(account.address);
    const supportedChains = await custodianApi.getSupportedChains();
    return chains.filter((chain) =>
      supportedChains.includes(convertHexChainIdToCaip2Decimal(chain)),
    );
  }

  async updateAccount(_account: CustodialKeyringAccount): Promise<void> {
    throw new MethodNotFoundError() as Error;
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await this.#stateManager.withTransaction(async () => {
        await this.#stateManager.removeAccounts([id]);
        await this.#emitEvent(KeyringEvent.AccountDeleted, { id });
      });
    } catch (error) {
      logger.error(error);
      throwError((error as Error).message);
    }
  }

  // Maintain compatibility with the keyring api, return the request in the original form that we received (i.e. the keyringRequest)
  async listRequests(): Promise<KeyringRequest[]> {
    if (config.dev) {
      const requests = await this.#requestManagerFacade.listRequests();
      return requests.map((request) => request.keyringRequest);
    }
    return [];
  }

  // Maintain compatibility with the keyring api, return the request in the original form that we received (i.e. the keyringRequest)
  async getRequest(id: string): Promise<KeyringRequest> {
    assert(id, string());

    if (config.dev) {
      const requests = await this.#requestManagerFacade.listRequests();
      const request = requests.find((req) => req.keyringRequest.id === id);
      if (!request) {
        throw new Error(`Request '${id}' not found`);
      }
      return request.keyringRequest;
    }
    throw new Error('Method not implemented.'); // Not in permissions, but required by the keyring api
  }

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    // These requests may come from dapps, so in production we should use runSensitive

    if (config.dev) {
      return this.#asyncSubmitRequest(request);
    }
    // Allow errors to be exposed here, because
    // the issue is likely to be with the request

    assert(request, KeyringRequestStruct);

    // But not here, because the issue is likely to be with the snap or the custodian api
    return runSensitive(
      async () => this.#asyncSubmitRequest(request),
      'An unexpected error occurred',
    );
  }

  async approveRequest(_id: string): Promise<void> {
    throw new Error('Method not implemented.'); // Not in permissions, but required by the keyring api
  }

  async rejectRequest(_id: string): Promise<void> {
    throw new Error('Method not implemented.'); // Not in permissions, but required by the keyring api
  }

  async getCustodianApiForAddress(address: string): Promise<ICustodianApi> {
    const checksumAddress = toChecksumAddress(address);
    if (!this.#custodianApi.has(checksumAddress)) {
      const wallet = await this.#stateManager.getWalletByAddress(
        checksumAddress,
      );
      if (!wallet) {
        logger.debug(
          `Wallet does not exist error. Address: ${address}, Checksum address: ${
            checksumAddress as string
          }`,
        );
        logger.debug(
          `All wallets: ${JSON.stringify(
            await this.#stateManager.listWallets(),
          )}`,
        );
        throw new Error(`Wallet for account ${address} does not exist`);
      }
      const custodianApi = this.#getCustodianApi(wallet.details);
      this.#custodianApi.set(checksumAddress, custodianApi);
      custodianApi.on(
        TOKEN_EXPIRED_EVENT,
        (payload: IRefreshTokenChangeEvent) => {
          this.#handleTokenChangedEvent(payload).catch(logger.error);
        },
      );
    }
    return this.#custodianApi.get(checksumAddress) as ICustodianApi;
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

  // Used by a custodian to check the status of a connection
  // by checking if a given token is present for a given
  // custodian type, environment and api url
  // Only returns accounts that match the origin which imported them
  async getConnectedAccounts(
    details: ConnectionStatusRpcRequest,
    origin: string,
  ): Promise<CustodialKeyringAccount[]> {
    const wallets = await this.#stateManager.listWallets();

    const matchingWallets = wallets.filter((wallet) => {
      return (
        wallet.details.token === details.token &&
        wallet.details.custodianApiUrl === details.custodianApiUrl &&
        wallet.details.custodianType === details.custodianType &&
        wallet.details.custodianEnvironment === details.custodianEnvironment &&
        wallet.account.options.custodian.importOrigin === origin
      );
    });
    return matchingWallets.map((wallet) => wallet.account);
  }

  // Handles a token changed event from a custodian
  async #handleTokenChangedEvent(
    payload: IRefreshTokenChangeEvent,
  ): Promise<void> {
    // Find all the wallets with the old refresh token
    const wallets = await this.#stateManager.listWallets();
    const walletsToUpdate = wallets.filter(
      (wallet) =>
        wallet.details.token === payload.oldRefreshToken &&
        wallet.details.custodianApiUrl === payload.apiUrl,
    );

    for (const wallet of walletsToUpdate) {
      // Create new details object with updated token
      const updatedDetails = {
        ...wallet.details,
        token: payload.newRefreshToken,
      };

      // Clear cache
      this.#custodianApi.delete(wallet.account.address);

      // Update state with new details
      await this.#stateManager.updateWalletDetails(
        wallet.account.id,
        updatedDetails,
      );
    }
  }

  async #asyncSubmitRequest(
    request: KeyringRequest,
  ): Promise<SubmitRequestResponse> {
    const custodianId = await this.#handleSigningRequest(
      request.request.method,
      request.request.params ?? [],
      request,
    );

    const account = await this.getAccount(request.account);

    if (!account) {
      throw new Error(`Account '${request.account}' not found`);
    }

    const { address } = account;

    // Distinguish between a transaction link and a message link

    let deepLink: CustodianDeepLink | null = null;

    // Custodians may not support all methods
    // but we don't store this anywhere, because they can implement them later
    // We rely on the custodian api to throw an error if the deeplink method is not supported
    // and generate a default message if that is the case

    try {
      if (request.request.method === EthMethod.SignTransaction) {
        const custodianApi = await this.getCustodianApiForAddress(address);
        deepLink = (await custodianApi.getTransactionLink(
          custodianId,
        )) as CustodianDeepLink;
      } else {
        const custodianApi = await this.getCustodianApiForAddress(address);
        deepLink = (await custodianApi.getSignedMessageLink(
          custodianId,
        )) as CustodianDeepLink;
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

    await renderInfoMessage(`${deepLink.text} Transaction ID: ${deepLink.id}`);
    return {
      pending: true,
    };
  }

  async #handleSigningRequest(
    method: string,
    params: Json,
    keyringRequest: KeyringRequest,
  ): Promise<string> {
    // Add method validation
    const account = await this.getAccount(keyringRequest.account);
    if (!account) {
      throw new Error(`Account '${keyringRequest.account}' not found`);
    }

    if (!account.methods.includes(method)) {
      throw new Error(
        `Method '${method}' not supported for account '${account.address}'`,
      );
    }

    switch (method) {
      case EthMethod.PersonalSign: {
        const [message, from] = params as [string, string];
        const custodianApi = await this.getCustodianApiForAddress(from);

        const details = await SignedMessageHelper.signPersonalMessage(
          from,
          message,
          custodianApi,
        );

        await this.#requestManagerFacade.upsertRequest({
          keyringRequest,
          type: 'message',
          subType: 'personalSign',
          fulfilled: false,
          rejected: false,
          message: details,
          signature: null,
          lastUpdated: Date.now(),
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
        const custodianApi = await this.getCustodianApiForAddress(from);
        const details = await SignedMessageHelper.signTypedData(
          from,
          data,
          custodianApi,
          { version: SignTypedDataVersion.V3 },
        );
        await this.#requestManagerFacade.upsertRequest({
          keyringRequest,
          type: 'message',
          subType: 'v3',
          fulfilled: false,
          rejected: false,
          message: details,
          signature: null,
          lastUpdated: Date.now(),
        });
        return details.id;
      }

      case EthMethod.SignTypedDataV4: {
        const [from, data] = params as [string, TypedMessage<MessageTypes>];
        const custodianApi = await this.getCustodianApiForAddress(from);
        const details = await SignedMessageHelper.signTypedData(
          from,
          data,
          custodianApi,
          { version: SignTypedDataVersion.V3 },
        );
        await this.#requestManagerFacade.upsertRequest({
          keyringRequest,
          type: 'message',
          subType: 'v4',
          fulfilled: false,
          rejected: false,
          message: details,
          signature: null,
          lastUpdated: Date.now(),
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
    // validation happens at handleSigningRequest
    try {
      const custodianApi = await this.getCustodianApiForAddress(tx.from);
      const payload = TransactionHelper.createTransactionPayload(tx);
      const wallet = await this.#stateManager.getWalletByAddress(tx.from);

      if (!wallet) {
        throw new Error(`Account '${tx.from}' not found`);
      }

      const custodianPublishesTransaction =
        wallet.account.options.custodian.deferPublication;

      const response = await custodianApi.createTransaction(payload, {
        chainId: tx.chainId,
        custodianPublishesTransaction,
      });

      await this.#requestManagerFacade.upsertRequest({
        keyringRequest,
        type: 'transaction',
        fulfilled: false,
        rejected: false,
        lastUpdated: Date.now(),
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

  async #emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(snap, event, data);
  }
}
