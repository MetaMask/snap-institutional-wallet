import custodianRequests from '../custodian/requests';
import type { GetSignedMessageByIdResponse } from '../types/rpc-responses/GetSignedMessageByIdResponse';

export const custodianGetSignedMessageById = async (
  id: string,
): Promise<GetSignedMessageByIdResponse | null> => {
  console.log('custodianGetSignedMessageById', id);
  const localSignedMessage = custodianRequests.getSignedMessage(id);
  if (localSignedMessage) {
    return localSignedMessage;
  }
  return null;
};
