export type ECA3TransactionParams = {
  from: string; // Sending address
  type: string; // Can be '0x1', '0x2', or '0x3' etc
  to: string; // 0x-prefixed hex string address
  gas: string; // 0x-prefixed hex string (Gas Limit)
  value: string; // 0x-prefixed hex string (Value)
  data?: string; // 0x-prefixed hex string (Data)
  gasPrice?: string; // 0x-prefixed hex string (Gas Price)
  maxPriorityFeePerGas?: string; // 0x-prefixed hex string (Max Priority Fee Per Gas)
  maxFeePerGas?: string; // 0x-prefixed hex string (Max Fee Per Gas)
};

export type ECA3TransactionMeta = {
  chainId: string;
  originUrl?: string;
  note?: string;
  transactionCategory?: string;
  custodianPublishesTransaction?: boolean;
  rpcUrl?: string;
};

export type ECA3CreateTransactionPayload = [
  ECA3TransactionParams,
  ECA3TransactionMeta,
];
