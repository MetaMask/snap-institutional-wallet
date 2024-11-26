export type ICactusSignatureResponse = {
  transactionStatus:
    | 'created'
    | 'approved'
    | 'submitted'
    | 'rejected'
    | 'failed'
    | 'completed';
  transactionHash: string;
  custodian_transactionId: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasLimit: string;
  nonce: string;
  from: string;
  signature: string;
};
