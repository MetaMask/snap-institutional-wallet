import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA3SignTypedDataResponse } from '../rpc-responses/ECA3SignTypedDataResponse';

export const mockECA3SignTypedDataResponse: JsonRpcResult<ECA3SignTypedDataResponse> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: 'ef8cb7af-1a00-4687-9f82-1f1c82fbef54',
  };
