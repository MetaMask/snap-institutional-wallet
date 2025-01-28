import type { CustodialKeyringAccount } from './CustodialKeyringAccount';
import type {
  CustodialSnapRequest,
  TransactionRequest,
  SignedMessageRequest,
  OnBoardingRpcRequest,
} from '../structs/CustodialKeyringStructs';

export type SnapState = {
  walletIds: string[];
  wallets: Record<string, Wallet>;
  requests: Record<
    string,
    CustodialSnapRequest<SignedMessageRequest | TransactionRequest>
  >;
};

export type Wallet = {
  account: CustodialKeyringAccount;
  details: OnBoardingRpcRequest;
};
