export type ReplaceTransactionParams = {
  transactionId: string;
  action: string;
  gas?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  gasLimit?: string;
};

export type ReplaceTransactionGasParams = {
  gas?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
};

export type ReplaceTransactionPayload = [
  ReplaceTransactionParams,
  ReplaceTransactionGasParams,
];
