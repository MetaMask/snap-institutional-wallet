import type { CustodialKeyringAccount } from './CustodialKeyringAccount';
import type {
  CustodialSnapRequest,
  TransactionRequest,
  SignedMessageRequest,
  OnBoardingRpcRequest,
} from '../structs/CustodialKeyringStructs';

export type SnapState = {
  activated: boolean;
  /**
   * @deprecated Dev mode moved to the unencrypted store, see `src/dev-mode.ts`.
   * Retained only so the one-time migration can read the old value.
   */
  devMode?: boolean;
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
