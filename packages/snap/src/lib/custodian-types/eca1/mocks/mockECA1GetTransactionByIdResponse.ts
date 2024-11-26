import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA1GetTransactionByIdResponse } from '../rpc-responses/ECA1GetTransactionByIdResponse';

export const mockECA1GetTransactionByIdResponse: JsonRpcResult<ECA1GetTransactionByIdResponse> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: {
      id: 'ef8cb7af-1a00-4687-9f82-1f1c82fbef54',
      type: '0x2',
      from: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
      to: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
      value: '0x0',
      gas: '0x5208',
      gasPrice: '0x4A817C800',
      nonce: '0x1',
      data: '0x',
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: {
        finished: true,
        submitted: true,
        signed: true,
        success: true,
        displayText: 'Mined',
        reason: '',
      },
    },
  };
