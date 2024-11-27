import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA3GetCustomerProofResponse } from '../rpc-responses/ECA3GetCustomerProofResponse';

export const mockJsonRpcGetCustomerProofResponse: JsonRpcResult<ECA3GetCustomerProofResponse> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: {
      jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYiLCJpc3MiOiJleGFtcGxlLmNvbSJ9.IlBfD4xmjpQiQCrkiIwIztEHrEH7e7RuswWPbIlJwUI',
    },
  };
