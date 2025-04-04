import type { Infer } from '@metamask/superstruct';
import type { Json } from '@metamask/utils';
/* eslint-disable @typescript-eslint/consistent-type-imports */
export enum EthAccountType {
  Eoa = 'eip155:eoa',
  Erc4337 = 'eip155:erc4337',
}

/**
 * A struct which represents a Keyring account object. It is abstract enough to
 * be used with any blockchain. Specific blockchain account types should extend
 * this struct.
 *
 * See {@link KeyringAccount}.
 */
export declare const KeyringAccountStruct: import('@metamask/superstruct').Struct<
  {
    type:
      | 'eip155:eoa'
      | 'eip155:erc4337'
      | 'bip122:p2wpkh'
      | 'solana:data-account';
    id: string;
    address: string;
    options: Record<string, import('@metamask/utils').Json>;
    methods: string[];
  },
  {
    /**
     * Account ID (UUIDv4).
     */
    id: import('@metamask/superstruct').Struct<string, null>;
    /**
     * Account type.
     */
    type: import('@metamask/superstruct').Struct<
      'eip155:eoa' | 'eip155:erc4337' | 'bip122:p2wpkh' | 'solana:data-account',
      {
        'eip155:eoa': 'eip155:eoa';
        'eip155:erc4337': 'eip155:erc4337';
        'bip122:p2wpkh': 'bip122:p2wpkh';
        'solana:data-account': 'solana:data-account';
      }
    >;
    /**
     * Account main address.
     */
    address: import('@metamask/superstruct').Struct<string, null>;
    /**
     * Account options.
     */
    options: import('@metamask/superstruct').Struct<
      Record<string, import('@metamask/utils').Json>,
      null
    >;
    /**
     * Account supported methods.
     */
    methods: import('@metamask/superstruct').Struct<
      string[],
      import('@metamask/superstruct').Struct<string, null>
    >;
  }
>;
/**
 * Keyring Account type represents an account and its properties from the
 * point of view of the keyring.
 */
export type KeyringAccount = Infer<typeof KeyringAccountStruct>;

export declare const KeyringRequestStruct: import('@metamask/superstruct').Struct<
  {
    id: string;
    scope: string;
    account: string;
    request: {
      method: string;
      params?:
        | import('@metamask/utils').Json[]
        | Record<string, import('@metamask/utils').Json>;
    };
  },
  {
    /**
     * Keyring request ID (UUIDv4).
     */
    id: import('@metamask/superstruct').Struct<string, null>;
    /**
     * Request's scope (CAIP-2 chain ID).
     */
    scope: import('@metamask/superstruct').Struct<string, null>;
    /**
     * Account ID (UUIDv4).
     */
    account: import('@metamask/superstruct').Struct<string, null>;
    /**
     * Inner request sent by the client application.
     */
    request: import('@metamask/superstruct').Struct<
      {
        method: string;
        params?:
          | import('@metamask/utils').Json[]
          | Record<string, import('@metamask/utils').Json>;
      },
      {
        method: import('@metamask/superstruct').Struct<string, null>;
        params: import('@metamask/superstruct').Struct<
          | import('../superstruct.cjs').ExactOptionalTag
          | import('@metamask/utils').Json[]
          | Record<string, import('@metamask/utils').Json>,
          null
        >;
      }
    >;
  }
>;
/**
 * Keyring request.
 *
 * Represents a request made to the keyring for account-related operations.
 */
export type KeyringRequest = Infer<typeof KeyringRequestStruct>;

/**
 * Supported keyring events.
 */
export declare enum KeyringEvent {
  AccountCreated = 'notify:accountCreated',
  AccountUpdated = 'notify:accountUpdated',
  AccountDeleted = 'notify:accountDeleted',
  RequestApproved = 'notify:requestApproved',
  RequestRejected = 'notify:requestRejected',
}

export declare enum KeyringRpcMethod {
  ListAccounts = 'keyring_listAccounts',
  GetAccount = 'keyring_getAccount',
  CreateAccount = 'keyring_createAccount',
  GetAccountBalances = 'keyring_getAccountBalances',
  FilterAccountChains = 'keyring_filterAccountChains',
  UpdateAccount = 'keyring_updateAccount',
  DeleteAccount = 'keyring_deleteAccount',
  ExportAccount = 'keyring_exportAccount',
  ListRequests = 'keyring_listRequests',
  GetRequest = 'keyring_getRequest',
  SubmitRequest = 'keyring_submitRequest',
  ApproveRequest = 'keyring_approveRequest',
  RejectRequest = 'keyring_rejectRequest',
}
export declare enum EthMethod {
  PersonalSign = 'personal_sign',
  Sign = 'eth_sign',
  SignTransaction = 'eth_signTransaction',
  SignTypedDataV1 = 'eth_signTypedData_v1',
  SignTypedDataV3 = 'eth_signTypedData_v3',
  SignTypedDataV4 = 'eth_signTypedData_v4',
  PrepareUserOperation = 'eth_prepareUserOperation',
  PatchUserOperation = 'eth_patchUserOperation',
  SignUserOperation = 'eth_signUserOperation',
}

export type Keyring = {
  /**
   * List accounts.
   *
   * Retrieves an array of KeyringAccount objects representing the available
   * accounts.
   *
   * @returns A promise that resolves to an array of KeyringAccount objects.
   */
  listAccounts(): Promise<KeyringAccount[]>;
  /**
   * Get an account.
   *
   * Retrieves the KeyringAccount object for the given account ID.
   *
   * @param id - The ID of the account to retrieve.
   * @returns A promise that resolves to the KeyringAccount object if found, or
   * undefined otherwise.
   */
  getAccount(id: string): Promise<KeyringAccount | undefined>;
  /**
   * Create an account.
   *
   * Creates a new account with optional, keyring-defined, account options.
   *
   * @param options - Keyring-defined options for the account (optional).
   * @returns A promise that resolves to the newly created KeyringAccount
   * object without any private information.
   */
  createAccount(options?: Record<string, Json>): Promise<KeyringAccount>;
  /**
   * Retrieve the balances of a given account.
   *
   * This method fetches the balances of specified assets for a given account
   * ID. It returns a promise that resolves to an object where the keys are
   * asset types and the values are balance objects containing the amount and
   * unit.
   *
   * @example
   * ```ts
   * await keyring.getAccountBalances(
   *   '43550276-c7d6-4fac-87c7-00390ad0ce90',
   *   ['bip122:000000000019d6689c085ae165831e93/slip44:0']
   * );
   * // Returns something similar to:
   * // {
   * //   'bip122:000000000019d6689c085ae165831e93/slip44:0': {
   * //     amount: '0.0001',
   * //     unit: 'BTC',
   * //   }
   * // }
   * ```
   * @param id - ID of the account to retrieve the balances for.
   * @param assets - Array of asset types (CAIP-19) to retrieve balances for.
   * @returns A promise that resolves to an object mapping asset types to their
   * respective balances.
   */

  /**
   * Filter supported chains for a given account.
   *
   * @param id - ID of the account to be checked.
   * @param chains - List of chains (CAIP-2) to be checked.
   * @returns A Promise that resolves to a filtered list of CAIP-2 IDs
   * representing the supported chains.
   */
  filterAccountChains(id: string, chains: string[]): Promise<string[]>;
  /**
   * Update an account.
   *
   * Updates the account with the given account object. Does nothing if the
   * account does not exist.
   *
   * @param account - The updated account object.
   * @returns A promise that resolves when the account is successfully updated.
   */
  updateAccount(account: KeyringAccount): Promise<void>;
  /**
   * Delete an account from the keyring.
   *
   * Deletes the account with the given ID from the keyring.
   *
   * @param id - The ID of the account to delete.
   * @returns A promise that resolves when the account is successfully deleted.
   */
  deleteAccount(id: string): Promise<void>;

  /**
   * List all submitted requests.
   *
   * Retrieves an array of KeyringRequest objects representing the submitted
   * requests.
   *
   * @returns A promise that resolves to an array of KeyringRequest objects.
   */
  listRequests?(): Promise<KeyringRequest[]>;
  /**
   * Get a request.
   *
   * Retrieves the KeyringRequest object for the given request ID.
   *
   * @param id - The ID of the request to retrieve.
   * @returns A promise that resolves to the KeyringRequest object if found, or
   * undefined otherwise.
   */
  getRequest?(id: string): Promise<KeyringRequest | undefined>;
  /**
   * Submit a request.
   *
   * Submits the given KeyringRequest object.
   *
   * @param request - The KeyringRequest object to submit.
   * @returns A promise that resolves to the request response.
   */
  submitRequest(request: KeyringRequest): Promise<KeyringResponse>;
  /**
   * Approve a request.
   *
   * Approves the request with the given ID and sets the response if provided.
   *
   * @param id - The ID of the request to approve.
   * @param data - The response to the request (optional).
   * @returns A promise that resolves when the request is successfully
   * approved.
   */
  approveRequest?(id: string, data?: Record<string, Json>): Promise<void>;
  /**
   * Reject a request.
   *
   * Rejects the request with the given ID.
   *
   * @param id - The ID of the request to reject.
   * @returns A promise that resolves when the request is successfully
   * rejected.
   */
  rejectRequest?(id: string): Promise<void>;
};

export declare const SubmitRequestRequestStruct: import('@metamask/superstruct').Struct<
  {
    jsonrpc: '2.0';
    id: string | number | null;
    method: 'keyring_submitRequest';
    params: {
      id: string;
      scope: string;
      account: string;
      request: {
        method: string;
        params?:
          | import('@metamask/utils').Json[]
          | Record<string, import('@metamask/utils').Json>;
      };
    };
  },
  {
    method: import('@metamask/superstruct').Struct<
      'keyring_submitRequest',
      'keyring_submitRequest'
    >;
    params: import('@metamask/superstruct').Struct<
      {
        id: string;
        scope: string;
        account: string;
        request: {
          method: string;
          params?:
            | import('@metamask/utils').Json[]
            | Record<string, import('@metamask/utils').Json>;
        };
      },
      {
        id: import('@metamask/superstruct').Struct<string, null>;
        scope: import('@metamask/superstruct').Struct<string, null>;
        account: import('@metamask/superstruct').Struct<string, null>;
        request: import('@metamask/superstruct').Struct<
          {
            method: string;
            params?:
              | import('@metamask/utils').Json[]
              | Record<string, import('@metamask/utils').Json>;
          },
          {
            method: import('@metamask/superstruct').Struct<string, null>;
            params: import('@metamask/superstruct').Struct<
              | import('../superstruct.cjs').ExactOptionalTag
              | import('@metamask/utils').Json[]
              | Record<string, import('@metamask/utils').Json>,
              null
            >;
          }
        >;
      }
    >;
    jsonrpc: import('@metamask/superstruct').Struct<'2.0', '2.0'>;
    id: import('@metamask/superstruct').Struct<string | number | null, null>;
  }
>;

export type SubmitRequestRequest = Infer<typeof SubmitRequestRequestStruct>;
export declare const SubmitRequestResponseStruct: import('@metamask/superstruct').Struct<
  | {
      pending: true;
      redirect?: {
        message?: string;
        url?: string;
      };
    }
  | {
      pending: false;
      result: import('@metamask/utils').Json;
    },
  null
>;
export type SubmitRequestResponse = Infer<typeof SubmitRequestResponseStruct>;

export declare const KeyringResponseStruct: import('@metamask/superstruct').Struct<
  | {
      pending: true;
      redirect?: {
        message?: string;
        url?: string;
      };
    }
  | {
      pending: false;
      result: import('@metamask/utils').Json;
    },
  null
>;
/**
 * Response to a call to `submitRequest`.
 *
 * Keyring implementations must return a response with `pending: true` if the
 * request will be handled asynchronously. Otherwise, the response must contain
 * the result of the request and `pending: false`.
 *
 * In the asynchronous case, the keyring can return a redirect URL and message
 * to be shown to the user. The user can choose to follow the link or cancel
 * the request. The main use case for this is to redirect the user to the snap
 * dapp to review the request.
 */
export type KeyringResponse = Infer<typeof KeyringResponseStruct>;
