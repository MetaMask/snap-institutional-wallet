export type ECA1TransactionParams = {
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

export type ECA1TransactionMeta = {
  chainId: string;
  originUrl?: string;
  note?: string;
  transactionCategory?: string;
};

export type ECA1CreateTransactionPayload = [
  ECA1TransactionParams,
  ECA1TransactionMeta,
];
