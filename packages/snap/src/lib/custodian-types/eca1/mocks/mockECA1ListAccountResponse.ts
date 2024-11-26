import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA1ListAccountsResponse } from '../rpc-responses/ECA1ListAccountsResponse';

export const mockECA1ListAccountResponse: JsonRpcResult<ECA1ListAccountsResponse> =
  {
    jsonrpc: '2.0',
    result: [
      {
        name: 'Daily Temporary Widow Spider',
        address: '0xb2c77973279baaaf48c295145802695631d50c01',
        tags: [
          {
            name: 'Account Name',
            value: 'Daily Temporary Widow Spider',
          },
        ],
      },
      {
        name: 'Elegantly Jittery Viper Fish',
        address: '0x033e270c08c3f297f99660f958d5f615207c1adf',
        tags: [
          {
            name: 'Account Name',
            value: 'Elegantly Jittery Viper Fish',
          },
        ],
      },
      {
        name: 'Accidentally Wasteful Narwhal',
        address: '0x184d6e811ce765e644a648c868f9e47de9ff07d0',
        tags: [
          {
            name: 'Account Name',
            value: 'Accidentally Wasteful Narwhal',
          },
        ],
      },
      {
        name: 'Inwardly Frail Caribou',
        address: '0x367dacaf26cc1381f31911676ba40088938aa677',
        tags: [
          {
            name: 'Account Name',
            value: 'Inwardly Frail Caribou',
          },
        ],
      },
      {
        name: 'Kiddingly Icy Monkey',
        address: '0x8b2d8220e3cfde9be681a5f0b3f6b324c003b3ad',
        tags: [
          {
            name: 'Account Name',
            value: 'Kiddingly Icy Monkey',
          },
        ],
      },
    ],
    id: 1,
  };
