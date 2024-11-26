import type { ITransactionStatus } from '.';

export type ITransactionDetails = {
  transactionStatus: ITransactionStatus;
  transactionHash?: string | null; // Optional because signatures have no hash and not all transactions are submitted yet
  custodianTransactionId: string;
  from: string;
  gasPrice?: string | null;
  gasLimit?: string | null;
  maxFeePerGas?: string | null;
  maxPriorityFeePerGas?: string | null;
  nonce?: string | null; // Optional because non-submitted transactions have no nonce
  reason?: string | null; // Optional because only JSON-RPC transactions have a reason

  // Immutable params can be return from the custodian API but they are not needed to update transactions

  to?: string; // Optional because it's not really needed and some custodians do not set this
  value?: string; // Optional because it's not really needed and some custodians do not set this
  data?: string; // Optional because it's not really needed and some custodians do not set this

  transactionStatusDisplayText?: string; // Optional because it's used for displayText from custodian transaction

  transactionId?: string;

  chainId?: number | null;
  custodianPublishesTransaction: boolean;
  signedRawTransaction?: string | null;
  rpcUrl?: string | null;
  note?: string;

  v?: string | null;
  r?: string | null;
  s?: string | null;
  type?: string | null;
};
