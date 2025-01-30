import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { JsonRpcListAccountChainIdsResponse } from '../rpc-responses/ECA3ListAccountChainIdsResponse';

export const mockECA3ListAccountChainIdsResponse: JsonRpcResult<JsonRpcListAccountChainIdsResponse> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: ['0x1', '0x3'],
  };
