// eslint-disable-next-line @typescript-eslint/no-shadow
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
import logger from '../../../logger';
import factory from '../../../util/json-rpc-call';
import type { IRefreshTokenChangeEvent } from '../../types';
import type { JsonRpcResult } from '../../types/JsonRpcResult';
import { TOKEN_EXPIRED_EVENT, REFRESH_TOKEN_CHANGE_EVENT } from '../constants';

export class ECA3Client extends EventEmitter {
  #call: <Params, Result>(
    method: string,
    params: Params,
    accessToken: string,
  ) => Promise<Result>;

  #cache: SimpleCache;

  #apiBaseUrl: string;

  #refreshToken: string;

  #refreshTokenUrl: string;

  // At the start, we don't know how long the token will be valid for
  #cacheAge = null;

  constructor(
    apiBaseUrl: string,
    refreshToken: string,
    refreshTokenUrl: string,
  ) {
    super();

    this.#apiBaseUrl = apiBaseUrl;
    this.#refreshToken = refreshToken;
    this.#refreshTokenUrl = refreshTokenUrl;

    this.#call = factory(`${apiBaseUrl}/v3/json-rpc`);

    this.#cache = new SimpleCache();
  }

  // This could be from a "top down" refresh token change
  // which doesn't emit an event

  setRefreshToken(refreshToken: string) {
    const payload: IRefreshTokenChangeEvent = {
      oldRefreshToken: this.#refreshToken,
      newRefreshToken: refreshToken,
      apiUrl: this.#apiBaseUrl,
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
      const data = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        grant_type: 'refresh_token',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        refresh_token: this.#refreshToken,
      };

      const options = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await fetch(this.#refreshTokenUrl, {
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
      if (response?.status === 401 && responseJson.url) {
        const url = responseJson.url as string;
        const oldRefreshToken = this.#refreshToken;
        const hashedToken = crypto
          .createHash('sha256')
          .update(oldRefreshToken + url)
          .digest('hex');

        this.emit(TOKEN_EXPIRED_EVENT, {
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
        logger.debug(
          `ECA3Client: Refresh token changed to ${newRefreshToken.substring(
            0,
            5,
          )}...${newRefreshToken.substring(newRefreshToken.length - 5)}`,
        );

        const oldRefreshToken = this.#refreshToken;
        this.setRefreshToken(newRefreshToken);

        // This is a "bottom up" refresh token change, from the custodian
        const payload: IRefreshTokenChangeEvent = {
          apiUrl: this.#apiBaseUrl,
          oldRefreshToken,
          newRefreshToken: responseJson.refresh_token,
        };
        this.emit(REFRESH_TOKEN_CHANGE_EVENT, payload);
      }

      return responseJson.access_token;
    } catch (error) {
      const { message } = error as Error;
      throw new Error(`Error getting the Access Token: ${message}`);
    }
  }

  async listAccounts(): Promise<JsonRpcResult<ECA3ListAccountsResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_listAccounts', {}, accessToken);
  }

  async listAccountsSigned(): Promise<
    JsonRpcResult<ECA3ListAccountsSignedResponse>
  > {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_listAccountsSigned', {}, accessToken);
  }

  async replaceTransaction(
    replaceTransactionPayload: ECA3ReplaceTransactionPayload,
  ): Promise<JsonRpcResult<ECA3ReplaceTransactionResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_replaceTransaction',
      replaceTransactionPayload,
      accessToken,
    );
  }

  async getCustomerProof(): Promise<
    JsonRpcResult<ECA3GetCustomerProofResponse>
  > {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_getCustomerProof', {}, accessToken);
  }

  async createTransaction(
    createTransactionPayload: ECA3CreateTransactionPayload,
  ): Promise<JsonRpcResult<ECA3CreateTransactionResult>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_createTransaction',
      createTransactionPayload,
      accessToken,
    );
  }

  async getAccountChainIds(
    listAccountChainIdPayload: ECA3ListAccountChainIdsPayload,
  ): Promise<JsonRpcResult<string[]>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_listAccountChainIds',
      listAccountChainIdPayload,
      accessToken,
    );
  }

  async signPersonalMessage(
    signPayload: ECA3SignedMessagePayload,
  ): Promise<JsonRpcResult<ECA3SignResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_sign', signPayload, accessToken);
  }

  async signTypedData(
    signPayload: ECA3SignTypedDataPayload,
  ): Promise<JsonRpcResult<ECA3SignTypedDataResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call('custodian_signTypedData', signPayload, accessToken);
  }

  async getTransaction(
    getTransactionPayload: ECA3GetTransactionByIdPayload,
  ): Promise<JsonRpcResult<ECA3GetTransactionByIdResponse | null>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_getTransactionById',
      getTransactionPayload,
      accessToken,
    );
  }

  async getSignedMessage(
    getSignedMessagePayload: ECA3GetSignedMessageByIdPayload,
  ): Promise<JsonRpcResult<ECA3GetSignedMessageByIdResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_getSignedMessageById',
      getSignedMessagePayload,
      accessToken,
    );
  }

  async getTransactionLink(
    getTransactionLinkPayload: ECA3GetTransactionLinkPayload,
  ): Promise<JsonRpcResult<ECA3GetTransactionLinkResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_getTransactionLink',
      getTransactionLinkPayload,
      accessToken,
    );
  }

  async getSignedMessageLink(
    getSignedMessageLinkPayload: ECA3GetSignedMessageLinkPayload,
  ): Promise<JsonRpcResult<ECA3GetSignedMessageLinkResponse>> {
    const accessToken = await this.getAccessToken();

    return this.#call(
      'custodian_getSignedMessageLink',
      getSignedMessageLinkPayload,
      accessToken,
    );
  }
}
