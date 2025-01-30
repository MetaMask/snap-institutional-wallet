import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA3CreateTransactionResult } from '../rpc-responses/ECA3CreateTransactionResult';

export const mockECA3CreateTransactionResponse: JsonRpcResult<ECA3CreateTransactionResult> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: 'ef8cb7af-1a00-4687-9f82-1f1c82fbef54',
  };
