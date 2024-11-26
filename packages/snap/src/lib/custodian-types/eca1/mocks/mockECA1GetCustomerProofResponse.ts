import type { ECA1Result } from '../../../types/ECA1Result';
import type { ECA1GetCustomerProofResponse } from '../rpc-responses/ECA1GetCustomerProofResponse';

export const mockECA1GetCustomerProofResponse: ECA1Result<ECA1GetCustomerProofResponse> =
  {
    id: 1,
    ECA1: '2.0',
    result: {
      jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYiLCJpc3MiOiJleGFtcGxlLmNvbSJ9.IlBfD4xmjpQiQCrkiIwIztEHrEH7e7RuswWPbIlJwUI',
    },
  };
