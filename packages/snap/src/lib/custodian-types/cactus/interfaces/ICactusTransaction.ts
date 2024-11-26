export type ICactusTransaction = {
  nonce: string;
  from: string;
  signature: null;
  transactionStatus:
    | 'created'
    | 'approved'
    | 'submitted'
    | 'rejected'
    | 'failed'
    | 'completed';
  transactionHash: string | null;
  custodian_transactionId: string;
  gasPrice: string;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  gasLimit: string;
};
