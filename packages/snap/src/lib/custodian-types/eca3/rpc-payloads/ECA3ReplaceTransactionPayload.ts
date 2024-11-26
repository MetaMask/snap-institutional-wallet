export type ECA3ReplaceTransactionParams = {
  transactionId: string;
  action?: string;
  gas?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  gasLimit?: string;
};

export type ECA3ReplaceTransactionGasParams = {
  gas?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
};

export type ECA3ReplaceTransactionPayload = [
  ECA3ReplaceTransactionParams,
  ECA3ReplaceTransactionGasParams,
];
