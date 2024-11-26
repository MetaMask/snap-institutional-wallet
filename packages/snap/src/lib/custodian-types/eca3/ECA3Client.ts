import crypto from 'crypto';
import { EventEmitter } from 'events';

import { SimpleCache } from '../../simple-cache';
import type { ECA3CreateTransactionPayload } from './rpc-payloads/ECA3CreateTransactionPayload';
import type { ECA3GetSignedMessageByIdPayload } from './rpc-payloads/ECA3GetSignedMessageByIdPayload';
import type { ECA3GetSignedMessageLinkPayload } from './rpc-payloads/ECA3GetSignedMessageLinkPayload';
import type { ECA3GetTransactionByIdPayload } from './rpc-payloads/ECA3GetTransactionByIdPayload';
import type { ECA3GetTransactionLinkPayload } from './rpc-payloads/ECA3GetTransactionLinkPayload';
import type { ECA3ListAccountChainIdsPayload } from './rpc-payloads/ECA3ListAccountChainIdsPayload';
import type { ECA3ReplaceTransactionPayload } from './rpc-payloads/ECA3ReplaceTransactionPayload';
import type { ECA3SignedMessagePayload } from './rpc-payloads/ECA3SignPayload';
import type { ECA3SignTypedDataPayload } from './rpc-payloads/ECA3SignTypedDataPayload';
import type { ECA3CreateTransactionResult } from './rpc-responses/ECA3CreateTransactionResult';
import type { ECA3GetCustomerProofResponse } from './rpc-responses/ECA3GetCustomerProofResponse';
import type { ECA3GetSignedMessageByIdResponse } from './rpc-responses/ECA3GetSignedMessageByIdResponse';
import type { ECA3GetSignedMessageLinkResponse } from './rpc-responses/ECA3GetSignedMessageLinkResponse';
import type { ECA3GetTransactionByIdResponse } from './rpc-responses/ECA3GetTransactionByIdResponse';
import type { ECA3GetTransactionLinkResponse } from './rpc-responses/ECA3GetTransactionLinkResponse';
import type { ECA3ListAccountsResponse } from './rpc-responses/ECA3ListAccountsResponse';
import type { ECA3ListAccountsSignedResponse } from './rpc-responses/ECA3ListAccountsSignedResponse';
import type { ECA3ReplaceTransactionResponse } from './rpc-responses/ECA3ReplaceTransactionResponse';
import type { ECA3SignResponse } from './rpc-responses/ECA3SignResponse';
import type { ECA3SignTypedDataResponse } from './rpc-responses/ECA3SignTypedDataResponse';
import factory from '../../../util/json-rpc-call';
import type { IRefreshTokenChangeEvent } from '../../types';
import type { JsonRpcResult } from '../../types/JsonRpcResult';
import {
  API_REQUEST_LOG_EVENT,
  INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT,
  REFRESH_TOKEN_CHANGE_EVENT,
} from '../constants';

export class ECA3Client extends EventEmitter {
  private readonly call: <T1, T2>(
    method: string,
    params: T1,
    accessToken: string,
  ) => Promise<JsonRpcResult<T2>>;

  private readonly cache: SimpleCache;

  // At the start, we don't know how long the token will be valid for
  private cacheAge = null;

  constructor(
    private readonly apiBaseUrl: string,
    private refreshToken: string,
    private readonly refreshTokenUrl: string,
  ) {
    super();

    this.call = factory(`${this.apiBaseUrl}/v3/json-rpc`, this.emit.bind(this));

    this.cache = new SimpleCache();
  }

  // This could be from a "top down" refresh token change
  // which doesn't emit an event

  setRefreshToken(refreshToken: string) {
    const payload: IRefreshTokenChangeEvent = {
      oldRefreshToken: this.refreshToken,
      newRefreshToken: refreshToken,
    };
    this.emit(REFRESH_TOKEN_CHANGE_EVENT, payload);
    this.refreshToken = refreshToken;
  }

  async getAccessToken(): Promise<string> {
    if (this.cacheAge) {
      const cacheExists = this.cache.cacheExists('accessToken');

      if (cacheExists && this.cache.cacheValid('accessToken', this.cacheAge)) {
        return this.cache.getCache<string>('accessToken');
      }
    }

    try {
      const data = {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      };

      const options = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await fetch(this.refreshTokenUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: options.headers,
        credentials: 'same-origin', // this is the default value for "withCredentials" in the Fetch API
      });

      const responseJson = await response.json();

      /**
       * If the server responds with a 401 status code when trying to get the access token,
       * it means the refresh token provided is no longer valid.
       * This could be due to the token being expired, revoked, or the token not being recognized by the server.
       */
      if (response?.status === 401 && responseJson?.url) {
        const url = responseJson?.url;
        const oldRefreshToken = this.refreshToken;
        const hashedToken = crypto
          .createHash('sha256')
          .update(oldRefreshToken + url)
          .digest('hex');

        this.emit(INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT, {
          url,
          oldRefreshToken: hashedToken,
        });

        throw new Error('Refresh token provided is no longer valid.');
      }

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}: ${responseJson.message}`,
        );
      }

      this.cacheAge = responseJson.expires_in;
      this.cache.setCache<string>('accessToken', responseJson.access_token);

      if (
        responseJson.refresh_token &&
        responseJson.refresh_token !== this.refreshToken
      ) {
        console.log(
          `ECA3Client: Refresh token changed to ${responseJson.refresh_token.substring(
            0,
            5,
          )}...${responseJson.refresh_token.substring(
            responseJson.refresh_token.length - 5,
          )}`,
        );

        const oldRefreshToken = this.refreshToken;
        this.setRefreshToken(responseJson.refresh_token);

        // This is a "bottom up" refresh token change, from the custodian
        const payload: IRefreshTokenChangeEvent = {
          oldRefreshToken,
          newRefreshToken: responseJson.refresh_token,
        };
        this.emit(REFRESH_TOKEN_CHANGE_EVENT, payload);
      }

      this.emit(API_REQUEST_LOG_EVENT, {
        method: 'POST',
        endpoint: this.refreshTokenUrl,
        success: response.ok,
        timestamp: new Date().toISOString(),
        errorMessage: response.ok ? undefined : responseJson.message,
      });

      return responseJson.access_token;
    } catch (error) {
      this.emit(API_REQUEST_LOG_EVENT, {
        method: 'POST',
        endpoint: this.refreshTokenUrl,
        success: false,
        timestamp: new Date().toISOString(),
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Error getting the Access Token: ${error}`);
    }
  }

  async listAccounts(): Promise<JsonRpcResult<ECA3ListAccountsResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_listAccounts', {}, accessToken);
  }

  async listAccountsSigned(): Promise<
    JsonRpcResult<ECA3ListAccountsSignedResponse>
  > {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_listAccountsSigned', {}, accessToken);
  }

  async replaceTransaction(
    replaceTransactionPayload: ECA3ReplaceTransactionPayload,
  ): Promise<JsonRpcResult<ECA3ReplaceTransactionResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_replaceTransaction',
      replaceTransactionPayload,
      accessToken,
    );
  }

  async getCustomerProof(): Promise<
    JsonRpcResult<ECA3GetCustomerProofResponse>
  > {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_getCustomerProof', {}, accessToken);
  }

  async createTransaction(
    createTransactionPayload: ECA3CreateTransactionPayload,
  ): Promise<JsonRpcResult<ECA3CreateTransactionResult>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_createTransaction',
      createTransactionPayload,
      accessToken,
    );
  }

  async getAccountChainIds(
    listAccountChainIdPayload: ECA3ListAccountChainIdsPayload,
  ): Promise<JsonRpcResult<string[]>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_listAccountChainIds',
      listAccountChainIdPayload,
      accessToken,
    );
  }

  async signPersonalMessage(
    signPayload: ECA3SignedMessagePayload,
  ): Promise<JsonRpcResult<ECA3SignResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_sign', signPayload, accessToken);
  }

  async signTypedData(
    signPayload: ECA3SignTypedDataPayload,
  ): Promise<JsonRpcResult<ECA3SignTypedDataResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_signTypedData', signPayload, accessToken);
  }

  async getTransaction(
    getTransactionPayload: ECA3GetTransactionByIdPayload,
  ): Promise<JsonRpcResult<ECA3GetTransactionByIdResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_getTransactionById',
      getTransactionPayload,
      accessToken,
    );
  }

  async getSignedMessage(
    getSignedMessagePayload: ECA3GetSignedMessageByIdPayload,
  ): Promise<JsonRpcResult<ECA3GetSignedMessageByIdResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_getSignedMessageById',
      getSignedMessagePayload,
      accessToken,
    );
  }

  async getTransactionLink(
    getTransactionLinkPayload: ECA3GetTransactionLinkPayload,
  ): Promise<JsonRpcResult<ECA3GetTransactionLinkResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_getTransactionLink',
      getTransactionLinkPayload,
      accessToken,
    );
  }

  async getSignedMessageLink(
    getSignedMessageLinkPayload: ECA3GetSignedMessageLinkPayload,
  ): Promise<JsonRpcResult<ECA3GetSignedMessageLinkResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_getSignedMessageLink',
      getSignedMessageLinkPayload,
      accessToken,
    );
  }
}
