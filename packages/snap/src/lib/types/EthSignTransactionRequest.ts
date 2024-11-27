// This is the form of the request object that is sent to the snap
type TransactionBase = {
  chainId: string;
  nonce: string;
  maxPriorityFeePerGas: string;
  to: string;
  value: string;
  data: string;
  accessList: [];
  from: string;
};

type TransactionEIP1559 = TransactionBase & {
  maxFeePerGas: string;
  type: '0x2';
};

type TransactionLegacy = TransactionBase & {
  gasPrice: string;
  type: '0x1';
};
export type EthSignTransactionRequest = TransactionEIP1559 | TransactionLegacy;
