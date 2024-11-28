import type { KeyringRequest } from '@metamask/keyring-api';

import type { CustodialKeyringAccount } from './CustodialKeyringAccount';
import type { ISignedMessageDetails } from './ISignedMessageDetails';
import type { ITransactionDetails } from './ITransactionDetails';
import type { OnBoardingRpcRequest } from './OnBoardingRpcRequest';

export type KeyringState = {
  wallets: Record<string, Wallet>;
  requests: Record<
    string,
    CustodialSnapRequest<SignedMessageRequest | TransactionRequest>
  >;
};

export type TransactionRequest = {
  type: 'transaction';
  transaction: ITransactionDetails; // This is what comes from the custodian
  signature: { r: string; s: string; v: string } | null;
};

type PersonalSignMessageRequest = {
  type: 'message';
  message: ISignedMessageDetails;
  subType: 'personalSign';
  signature: string | null;
};

type TypedMessageRequest = {
  type: 'message';
  message: ISignedMessageDetails;
  subType: 'v3' | 'v4';
  signature: string | null;
};

export type SignedMessageRequest =
  | TypedMessageRequest
  | PersonalSignMessageRequest;

export type CustodialSnapRequest<RequestType> = {
  keyringRequest: KeyringRequest;
  fulfilled: boolean;
  rejected: boolean;
} & RequestType;

export type Wallet = {
  account: CustodialKeyringAccount;
  details: OnBoardingRpcRequest;
};

export type CreateAccountOptions = {
  name: string;
  address: string;
  details: OnBoardingRpcRequest;
};
