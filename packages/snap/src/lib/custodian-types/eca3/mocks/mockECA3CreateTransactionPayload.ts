import type { ECA3CreateTransactionPayload } from '../rpc-payloads/ECA3CreateTransactionPayload';

export const mockECA3CreateTransactionPayload: ECA3CreateTransactionPayload = [
  {
    from: '0xb2c77973279baaaf48c295145802695631d50c01',
    to: '0x57f36031E223FabC1DaF93B401eD9F4F1Acc6904',
    type: '0x2',
    value: '0x1',
    gas: '0x5208',
    maxFeePerGas: '0x59682f0e',
    maxPriorityFeePerGas: '0x59682f0e',
  },
  {
    chainId: '0x4',
    originUrl: 'https://www.example.com',
  },
];
