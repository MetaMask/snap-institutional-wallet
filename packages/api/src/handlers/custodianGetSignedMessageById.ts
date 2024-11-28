import { GetSignedMessageByIdResponse } from '../types/rpc-responses/GetSignedMessageByIdResponse';
import custodianRequests from '../custodian/requests';

export const custodianGetSignedMessageById = async (
  id: string,
): Promise<GetSignedMessageByIdResponse | null> => {
  const localSignedMessage = custodianRequests.getSignedMessage(id);
  if (localSignedMessage) {
    return localSignedMessage;
  }
  return null;
};
