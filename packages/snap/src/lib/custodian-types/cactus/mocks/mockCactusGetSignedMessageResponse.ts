import type { ICactusSignatureResponse } from '../interfaces/ICactusSignatureResponse';

export const mockCactusGetSignedMessageResponse: ICactusSignatureResponse = {
  from: '0x05CA0e55d90D9A29051514fD03646936b0348b7f',
  signature: null,
  transactionStatus: 'submitted',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  custodian_transactionId: '51UGRQZFZJD777888000055',
  gasPrice: '1400000010',
  maxFeePerGas: null,
  maxPriorityFeePerGas: null,
  gasLimit: '133997',
};
