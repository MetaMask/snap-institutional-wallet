import type { CustodialKeyringAccount } from './CustodialKeyringAccount';
import type {
  CustodialSnapRequest,
  TransactionRequest,
  SignedMessageRequest,
  OnBoardingRpcRequest,
} from '../structs/CustodialKeyringStructs';

export type SnapState = {
  activated: boolean;
  devMode: boolean;
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
