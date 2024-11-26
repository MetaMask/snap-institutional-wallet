export type ECA1GetTransactionByIdResponse = {
  id: string;
  type: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice?: string;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  nonce: string;
  data: string;
  hash: string;
  status: {
    finished: boolean;
    submitted: boolean;
    signed: boolean;
    success: boolean;
    displayText: string;
    reason: string;
  };
};
