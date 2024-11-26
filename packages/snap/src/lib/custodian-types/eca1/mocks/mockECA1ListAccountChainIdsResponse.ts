import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA1ListAccountChainIdsResponse } from '../rpc-responses/ECA1ListAccountChainIdsResponse';

export const mockECA1ListAccountChainIdsResponse: JsonRpcResult<ECA1ListAccountChainIdsResponse> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: ['0x1', '0x3'],
  };
