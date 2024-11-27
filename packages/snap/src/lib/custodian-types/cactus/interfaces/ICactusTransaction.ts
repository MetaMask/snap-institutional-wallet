export type ICactusTransaction = {
  nonce: string | null;
  from: string;
  signature: string | null;
  transactionStatus:
    | 'created'
    | 'approved'
    | 'submitted'
    | 'rejected'
    | 'failed'
    | 'completed';
  transactionHash: string | null;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  custodian_transactionId: string;
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  gasLimit: string | null;
};
