import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { JsonRpcCreateTransactionResult } from '../rpc-responses/ECA3CreateTransactionResult';

export const mockJsonRpcCreateTransactionResponse: JsonRpcResult<JsonRpcCreateTransactionResult> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: 'ef8cb7af-1a00-4687-9f82-1f1c82fbef54',
  };
