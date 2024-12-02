import custodianRequests from '../custodian/requests';
import type { CreateTransactionPayload } from '../types/rpc-payloads/CreateTransactionPayload';

export const custodianCreateTransaction = async (
  payload: CreateTransactionPayload[0],
  _metadata: CreateTransactionPayload[1],
): Promise<string> => {
  const id = custodianRequests.addTransaction({
    transaction: payload,
    metadata: _metadata,
  });

  return id;
};
