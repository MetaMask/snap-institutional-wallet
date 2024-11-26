import type { MessageTypes, TypedMessage } from '@metamask/eth-sig-util';
import type { KeyringRequest } from '@metamask/keyring-api';

import type { CustodialKeyringAccount } from './CustodialKeyringAccount';
import type { ITransactionDetails } from './ITransactionDetails';
import type { OnBoardingRpcRequest } from './OnBoardingRpcRequest';

export type KeyringState = {
  wallets: Record<string, Wallet>;
  pendingRequests: Record<string, KeyringRequest>;
  pendingSignMessages: Record<string, string | TypedMessage<MessageTypes>>;
  pendingTransactions: Record<string, ITransactionDetails>;
};

export type Wallet = {
  account: CustodialKeyringAccount;
  details: OnBoardingRpcRequest;
};

export type CreateAccountOptions = {
  name: string;
  address: string;
  details: OnBoardingRpcRequest;
};
