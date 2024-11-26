import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA1CreateTransactionResult } from '../rpc-responses/ECA1CreateTransactionResult';

export const mockECA1CreateTransactionResponse: JsonRpcResult<ECA1CreateTransactionResult> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: 'ef8cb7af-1a00-4687-9f82-1f1c82fbef54',
  };
