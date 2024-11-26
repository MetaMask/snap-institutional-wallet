import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA1SignTypedDataResponse } from '../rpc-responses/ECA1SignTypedDataResponse';

export const mockECA1SignTypedDataResponse: JsonRpcResult<ECA1SignTypedDataResponse> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: 'ef8cb7af-1a00-4687-9f82-1f1c82fbef54',
  };
