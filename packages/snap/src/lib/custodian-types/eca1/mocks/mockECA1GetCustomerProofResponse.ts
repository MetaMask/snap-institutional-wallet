import type { JsonRpcResult } from '../../../types/JsonRpcResult';
import type { ECA1GetCustomerProofResponse } from '../rpc-responses/ECA1GetCustomerProofResponse';

export const mockECA1GetCustomerProofResponse: JsonRpcResult<ECA1GetCustomerProofResponse> =
  {
    id: 1,
    jsonrpc: '2.0',
    result: {
      jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYiLCJpc3MiOiJleGFtcGxlLmNvbSJ9.IlBfD4xmjpQiQCrkiIwIztEHrEH7e7RuswWPbIlJwUI',
    },
  };
