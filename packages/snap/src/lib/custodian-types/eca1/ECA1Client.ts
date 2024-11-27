// eslint-disable-next-line @typescript-eslint/no-shadow
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
import type { ECA1GetSignedMessageByIdResponse } from './rpc-responses/ECA1GetSignedMessageByIdResponse';
import type { ECA1GetTransactionByIdResponse } from './rpc-responses/ECA1GetTransactionByIdResponse';
import type { ECA1GetTransactionLinkResponse } from './rpc-responses/ECA1GetTransactionLinkResponse';
import type { ECA1ListAccountsResponse } from './rpc-responses/ECA1ListAccountsResponse';
import type { ECA1SignResponse } from './rpc-responses/ECA1SignResponse';
import type { ECA1SignTypedDataResponse } from './rpc-responses/ECA1SignTypedDataResponse';
import factory from '../../../util/json-rpc-call';
import { SimpleCache } from '../../simple-cache/SimpleCache';
import type { IRefreshTokenChangeEvent } from '../../types/IRefreshTokenChangeEvent';
import type { JsonRpcResult } from '../../types/JsonRpcResult';
import {
  INTERACTIVE_REPLACEMENT_TOKEN_CHANGE_EVENT,
  REFRESH_TOKEN_CHANGE_EVENT,
} from '../constants';

export class ECA1Client extends EventEmitter {
  #call: <Params, Result>(
    method: string,
    params: Params,
    accessToken: string,
  ) => Promise<Result>;

  #cache: SimpleCache;

  // At the start, we don't know how long the token will be valid for
  #cacheAge = null;

  #apiBaseUrl: string;

  #refreshToken: string;

  #refreshTokenUrl: string;

  constructor(
    apiBaseUrl: string,
    refreshToken: string,
    refreshTokenUrl: string,
  ) {
    super();

    this.#apiBaseUrl = apiBaseUrl;
    this.#refreshToken = refreshToken;
    this.#refreshTokenUrl = refreshTokenUrl;

    this.#call = factory(`${apiBaseUrl}/v1/json-rpc`);
    this.#cache = new SimpleCache();
  }

  // This could be from a "top down" refresh token change
  // which doesn't emit an event

  setRefreshToken(refreshToken: string) {
    const payload: IRefreshTokenChangeEvent = {
      oldRefreshToken: this.#refreshToken,
      newRefreshToken: refreshToken,
    };
    this.emit(REFRESH_TOKEN_CHANGE_EVENT, payload);
    this.#refreshToken = refreshToken;
  }

  async getAccessToken(): Promise<string> {
    if (this.#cacheAge) {
      const cacheExists = this.#cache.cacheExists('accessToken');

      if (
        cacheExists &&
        this.#cache.cacheValid('accessToken', this.#cacheAge)
      ) {
        return this.#cache.getCache<string>('accessToken');
      }
    }

    try {
      const data = `grant_type=refresh_token&refresh_token=${encodeURIComponent(
        this.#refreshToken,
      )}`;

      const options = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };

      const response = await fetch(this.#refreshTokenUrl, {
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
      if (response?.status === 401 && responseJson.url) {
        const url = responseJson.url as string;
        const oldRefreshToken = this.#refreshToken;
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
        const message = responseJson.message as string;
        throw new Error(
          `Request failed with status ${response.status}: ${message}`,
        );
      }

      this.#cacheAge = responseJson.expires_in;
      this.#cache.setCache<string>('accessToken', responseJson.access_token);

      if (
        responseJson.refresh_token &&
        responseJson.refresh_token !== this.#refreshToken
      ) {
        const newRefreshToken = responseJson.refresh_token as string;
        console.log(
          `ECA1Client: Refresh token changed to ${newRefreshToken.substring(
            0,
            5,
          )}...${newRefreshToken.substring(newRefreshToken.length - 5)}`,
        );

        const oldRefreshToken = this.#refreshToken;
        this.setRefreshToken(newRefreshToken);

        // This is a "bottom up" refresh token change, from the custodian
        const payload: IRefreshTokenChangeEvent = {
          oldRefreshToken,
          newRefreshToken,
        };
        this.emit(REFRESH_TOKEN_CHANGE_EVENT, payload);
      }

      return responseJson.access_token;
    } catch (error) {
      const { message } = error as Error;
      throw new Error(`Error getting the Access Token: ${message}`);
    }
  }

  async listAccounts(): Promise<JsonRpcResult<ECA1ListAccountsResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_listAccounts', {}, accessToken);
  }

  async getCustomerProof(): Promise<
    JsonRpcResult<ECA1GetCustomerProofResponse>
  > {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_getCustomerProof', {}, accessToken);
  }

  async createTransaction(
    createTransactionPayload: ECA1CreateTransactionPayload,
  ): Promise<JsonRpcResult<ECA1CreateTransactionResult>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_createTransaction',
      createTransactionPayload,
      accessToken,
    );
  }

  async getAccountChainIds(
    listAccountChainIdPayload: ECA1ListAccountChainIdsPayload,
  ): Promise<JsonRpcResult<string[]>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_listAccountChainIds',
      listAccountChainIdPayload,
      accessToken,
    );
  }

  async signPersonalMessage(
    signPayload: ECA1SignPayload,
  ): Promise<JsonRpcResult<ECA1SignResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_sign', signPayload, accessToken);
  }

  async signTypedData(
    signPayload: ECA1SignTypedDataPayload,
  ): Promise<JsonRpcResult<ECA1SignTypedDataResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_signTypedData', signPayload, accessToken);
  }

  async getTransaction(
    getTransactionPayload: ECA1GetTransactionByIdPayload,
  ): Promise<JsonRpcResult<ECA1GetTransactionByIdResponse | null>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_getTransactionById',
      getTransactionPayload,
      accessToken,
    );
  }

  async getSignedMessage(
    getSignedMessagePayload: ECA1GetSignedMessageByIdPayload,
  ): Promise<JsonRpcResult<ECA1GetSignedMessageByIdResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_getSignedMessageById',
      getSignedMessagePayload,
      accessToken,
    );
  }

  async getTransactionLink(
    getTransactionLinkPayload: ECA1GetTransactionLinkPayload,
  ): Promise<JsonRpcResult<ECA1GetTransactionLinkResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_getTransactionLink',
      getTransactionLinkPayload,
      accessToken,
    );
  }
}
