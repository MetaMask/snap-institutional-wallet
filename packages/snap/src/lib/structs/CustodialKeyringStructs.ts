import type { KeyringRequest } from '@metamask/keyring-api';
import type { Infer } from 'superstruct';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  literal,
  object,
  optional,
  string,
  nullable,
  boolean,
  enums,
} from 'superstruct';

import { CustodianType } from '../types/CustodianType';

export const TransactionStatus = object({
  finished: boolean(),
  success: boolean(),
  displayText: string(),
  reason: optional(string()),
  submitted: boolean(),
});

export type TransactionStatus = Infer<typeof TransactionStatus>;

export const TransactionDetails = object({
  transactionStatus: TransactionStatus,
  transactionHash: optional(nullable(string())), // Optional because signatures have no hash and not all transactions are submitted yet
  custodianTransactionId: string(),
  from: string(),
  gasPrice: optional(nullable(string())),
  gasLimit: optional(nullable(string())),
  maxFeePerGas: optional(nullable(string())),
  maxPriorityFeePerGas: optional(nullable(string())),
  nonce: optional(nullable(string())), // Optional because non-submitted transactions have no nonce
  reason: optional(nullable(string())), // Optional because only JSON-RPC transactions have a reason

  // Immutable params can be return from the custodian API but they are not needed to update transactions

  to: optional(string()), // Optional because it's not really needed and some custodians do not set this
  value: optional(string()), // Optional because it's not really needed and some custodians do not set this
  data: optional(string()), // Optional because it's not really needed and some custodians do not set this

  transactionId: optional(string()),

  chainId: optional(string()), // Optional because early custodian APIs did not return this
  custodianPublishesTransaction: boolean(),
  signedRawTransaction: optional(nullable(string())),
  rpcUrl: optional(nullable(string())),
  note: optional(string()),

  type: optional(nullable(string())),
});

export type TransactionDetails = Infer<typeof TransactionDetails>;

export const SignedMessageDetails = object({
  id: string(),
  signature: nullable(string()),
  status: object(),
  from: optional(string()),
});

export type SignedMessageDetails = Infer<typeof SignedMessageDetails>;

export const SignedMessageStatus = object({
  finished: boolean(),
  signed: boolean(),
  success: boolean(),
  displayText: string(),
  reason: optional(string()),
});

export type SignedMessageStatus = Infer<typeof SignedMessageStatus>;

export const OnBoardingRpcRequest = object({
  custodianType: enums([
    CustodianType.ECA3,
    CustodianType.ECA1,
    CustodianType.BitGo,
    CustodianType.Cactus,
  ]),
  custodianEnvironment: string(),
  custodianApiUrl: string(),
  custodianDisplayName: string(),
  apiUrl: string(),
  token: string(),
  refreshTokenUrl: string(),
});

export type OnBoardingRpcRequest = Infer<typeof OnBoardingRpcRequest>;

export const CreateAccountOptions = object({
  name: string(),
  address: string(),
  details: OnBoardingRpcRequest,
});

export type CreateAccountOptions = Infer<typeof CreateAccountOptions>;

export const TransactionRequest = object({
  type: literal('transaction'),
  transaction: TransactionDetails,
  signature: SignedMessageDetails,
});

export type TransactionRequest = Infer<typeof TransactionRequest>;

export const PersonalSignMessageRequest = object({
  type: literal('message'),
  message: SignedMessageDetails,
  subType: literal('personalSign'),
  signature: string(),
});

export type PersonalSignMessageRequest = Infer<
  typeof PersonalSignMessageRequest
>;

export const TypedMessageRequest = object({
  type: literal('message'),
  message: SignedMessageDetails,
  subType: enums(['v3', 'v4']),
  signature: nullable(string()),
});

export type TypedMessageRequest = Infer<typeof TypedMessageRequest>;

export type SignedMessageRequest =
  | TypedMessageRequest
  | PersonalSignMessageRequest;

// FIXME: Create a struct for this!
export type CustodialSnapRequest<RequestType> = {
  keyringRequest: KeyringRequest;
  fulfilled: boolean;
  rejected: boolean;
} & RequestType;
