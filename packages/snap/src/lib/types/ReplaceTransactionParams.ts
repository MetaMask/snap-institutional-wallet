export type ReplaceTransactionParams = {
  transactionId: string;
  action: string;
  gas?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  gasLimit?: string;
};
