import type { ICactusSignatureResponse } from '../interfaces/ICactusSignatureResponse';

export const mockCactusGetSignedMessageResponse: ICactusSignatureResponse = {
  nonce: '0',
  from: '0x05CA0e55d90D9A29051514fD03646936b0348b7f',
  signature: null,
  transactionStatus: 'submitted',
  transactionHash:
    '0xc12eec3f89e074d62d410cca70f0702d42f1ee8bfaa87f513ad728a5f5a6db51',
  custodian_transactionId: '51UGRQZFZJD777888000055',
  gasPrice: '1400000010',
  maxFeePerGas: null,
  maxPriorityFeePerGas: null,
  gasLimit: '133997',
};
