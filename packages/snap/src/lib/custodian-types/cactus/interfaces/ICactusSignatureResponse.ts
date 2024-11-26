export type ICactusSignatureResponse = {
  transactionStatus:
    | 'created'
    | 'approved'
    | 'submitted'
    | 'rejected'
    | 'failed'
    | 'completed';
  // eslint-disable-next-line @typescript-eslint/naming-convention
  custodian_transactionId: string;
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  gasLimit: string | null;
  from: string | null;
  signature: string | null;
};
