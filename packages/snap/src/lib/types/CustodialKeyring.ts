import type { CustodialKeyringAccount } from './CustodialKeyringAccount';
import type {
  CustodialSnapRequest,
  TransactionRequest,
  SignedMessageRequest,
  OnBoardingRpcRequest,
} from '../structs/CustodialKeyringStructs';

export type EncryptedState = {
  walletIds: string[];
  wallets: Record<string, Wallet>;
  requests: Record<
    string,
    CustodialSnapRequest<SignedMessageRequest | TransactionRequest>
  >;
};

export type State = {
  numberOfAccounts: number;
};

export type Wallet = {
  account: CustodialKeyringAccount;
  details: OnBoardingRpcRequest;
};
