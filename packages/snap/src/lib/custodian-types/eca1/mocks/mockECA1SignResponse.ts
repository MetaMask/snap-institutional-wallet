import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA1SignResponse } from '../rpc-responses/ECA1SignResponse';

export const mockECA1SignResponse: JsonRpcResult<ECA1SignResponse> = {
  id: 1,
  jsonrpc: '2.0',
  result: 'ef8cb7af-1a00-4687-9f82-1f1c82fbef54',
};
