import type { ECA3SignedMessagePayload } from '../rpc-payloads/ECA3SignPayload';

export const mockECA3SignPayload: ECA3SignedMessagePayload = [
  {
    address: '0xb2c77973279baaaf48c295145802695631d50c01',
    message: '0x48656c6c6f20776f726c64',
  },
  {
    chainId: '0x123',
    originUrl: 'metamask',
    note: '',
  },
];
