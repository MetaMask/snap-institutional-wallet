import type { ICactusTransaction } from '../interfaces/ICactusTransaction';

export const mockCactusCreateTransactionResult: ICactusTransaction = {
  nonce: null,
  from: '0x05CA0e55d90D9A29051514fD03646936b0348b7f',
  signature: null,
  transactionStatus: 'created',
  transactionHash: null,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  custodian_transactionId: '51UGRQZFZJD777888000055',
  gasPrice: '200000000000',
  maxFeePerGas: null,
  maxPriorityFeePerGas: null,
  gasLimit: '133997',
};
