import type { IBitgoEIP712Response } from '../interfaces/IBitgoEIP712Response';

export const bitgoMockEip712Response: IBitgoEIP712Response = {
  data: {
    id: 'f0feb582-cc07-4e43-af71-f4569eb1922b',
    coin: 'gteth',
    status: {
      finished: true,
      signed: true,
      success: true,
      displayText: 'signed',
    },
    createdTime: '2022-10-04T21:37:26.814Z',
    wallet: '12345',
    enterprise: '614a226f3da19200071b3d6a0180e87e',
    message: '\x19Ethereum Signed Message:\n13test_personal',
    signature: '0xtest',
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _meta: { reqId: 'a3672f35-36c5-461c-a71d-adc46e48835a' },
};
