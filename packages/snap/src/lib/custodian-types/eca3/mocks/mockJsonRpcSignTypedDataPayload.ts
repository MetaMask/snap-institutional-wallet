import type { JsonRpcSignTypedDataPayload } from '../rpc-payloads/ECA3SignTypedDataPayload';

export const mockJsonRpcSignTypedDataPayload: JsonRpcSignTypedDataPayload = [
  {
    address: '0xb2c77973279baaaf48c295145802695631d50c01',
    data: {
      types: {
        EIP712Domain: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'version',
            type: 'string',
          },
          {
            name: 'chainId',
            type: 'uint256',
          },
          {
            name: 'verifyingContract',
            type: 'address',
          },
        ],
        Person: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'wallet',
            type: 'address',
          },
        ],
        Mail: [
          {
            name: 'from',
            type: 'Person',
          },
          {
            name: 'to',
            type: 'Person',
          },
          {
            name: 'contents',
            type: 'string',
          },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      message: {
        from: {
          name: 'Cow',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
      },
    },
    version: 'v4',
  },
  {
    chainId: '0x1',
    originUrl: 'metamask',
    note: '',
  },
];
