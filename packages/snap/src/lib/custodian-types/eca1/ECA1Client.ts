import crypto from 'crypto';
import { EventEmitter } from 'events';

import type { ECA1CreateTransactionPayload } from './rpc-payloads/ECA1CreateTransactionPayload';
import type { ECA1GetSignedMessageByIdPayload } from './rpc-payloads/ECA1GetSignedMessageByIdPayload';
import type { ECA1GetTransactionByIdPayload } from './rpc-payloads/ECA1GetTransactionByIdPayload';
import type { ECA1GetTransactionLinkPayload } from './rpc-payloads/ECA1GetTransactionLinkPayload';
import type { ECA1ListAccountChainIdsPayload } from './rpc-payloads/ECA1ListAccountChainIdsPayload';
import type { ECA1SignPayload } from './rpc-payloads/ECA1SignPayload';
import type { ECA1SignTypedDataPayload } from './rpc-payloads/ECA1SignTypedDataPayload';
import type { ECA1CreateTransactionResult } from './rpc-responses/ECA1CreateTransactionResult';
import type { ECA1GetCustomerProofResponse } from './rpc-responses/ECA1GetCustomerProofResponse';
import type { ECA1ListAccountsResponse } from './rpc-responses/ECA1ListAccountsResponse';
import factory from "../../../util/json-rpc-call";
import { SimpleCache } from "../../simple-cache/SimpleCache";
import { IRefreshTokenChangeEvent } from "../../types/IRefreshTokenChangeEvent";
import { API_REQUEST_LOG_EVENT, INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT, REFRESH_TOKEN_CHANGE_EVENT } from "../constants";
import { JsonRpcResult } from "../../types/JsonRpcResult";
import type { ECA1SignResponse } from './rpc-responses/ECA1SignResponse';
import type { ECA1SignTypedDataResponse } from './rpc-responses/ECA1SignTypedDataResponse';
import type { ECA1GetTransactionByIdResponse } from './rpc-responses/ECA1GetTransactionByIdResponse';
import type { ECA1GetSignedMessageByIdResponse } from './rpc-responses/ECA1GetSignedMessageByIdResponse';
import type { ECA1GetTransactionLinkResponse } from './rpc-responses/ECA1GetTransactionLinkResponse';

export class ECA1Client extends EventEmitter {
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

    this.call = factory(`${this.apiBaseUrl}/v1/json-rpc`, this.emit.bind(this));

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
      const data = `grant_type=refresh_token&refresh_token=${encodeURIComponent(
        this.refreshToken,
      )}`;

      const options = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      const response = await fetch(this.refreshTokenUrl, {
        method: 'POST',
        body: data,
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
          `ECA1Client: Refresh token changed to ${responseJson.refresh_token.substring(
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
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Error getting the Access Token: ${error}`);
    }
  }

  async listAccounts(): Promise<JsonRpcResult<ECA1ListAccountsResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_listAccounts', {}, accessToken);
  }

  async getCustomerProof(): Promise<
    JsonRpcResult<ECA1GetCustomerProofResponse>
  > {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_getCustomerProof', {}, accessToken);
  }

  async createTransaction(
    createTransactionPayload: ECA1CreateTransactionPayload,
  ): Promise<JsonRpcResult<ECA1CreateTransactionResult>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_createTransaction',
      createTransactionPayload,
      accessToken,
    );
  }

  async getAccountChainIds(
    listAccountChainIdPayload: ECA1ListAccountChainIdsPayload,
  ): Promise<JsonRpcResult<string[]>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_listAccountChainIds',
      listAccountChainIdPayload,
      accessToken,
    );
  }

  async signPersonalMessage(
    signPayload: ECA1SignPayload,
  ): Promise<JsonRpcResult<ECA1SignResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_sign', signPayload, accessToken);
  }

  async signTypedData(
    signPayload: ECA1SignTypedDataPayload,
  ): Promise<JsonRpcResult<ECA1SignTypedDataResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call('custodian_signTypedData', signPayload, accessToken);
  }

  async getTransaction(
    getTransactionPayload: ECA1GetTransactionByIdPayload,
  ): Promise<JsonRpcResult<ECA1GetTransactionByIdResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_getTransactionById',
      getTransactionPayload,
      accessToken,
    );
  }

  async getSignedMessage(
    getSignedMessagePayload: ECA1GetSignedMessageByIdPayload,
  ): Promise<JsonRpcResult<ECA1GetSignedMessageByIdResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_getSignedMessageById',
      getSignedMessagePayload,
      accessToken,
    );
  }

  async getTransactionLink(
    getTransactionLinkPayload: ECA1GetTransactionLinkPayload,
  ): Promise<JsonRpcResult<ECA1GetTransactionLinkResponse>> {
    const accessToken = await this.getAccessToken();

    return this.call(
      'custodian_getTransactionLink',
      getTransactionLinkPayload,
      accessToken,
    );
  }
}
