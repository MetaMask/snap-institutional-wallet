import custodianRequests from '../custodian/requests';
import type { GetSignedMessageLinkResponse } from '../types/rpc-responses/GetSignedMessageLinkResponse';

export const custodianGetSignedMessageLink = async (
  id: string,
): Promise<GetSignedMessageLinkResponse | null> => {
  console.log('custodianGetSignedMessageLink', id);
  const localSignedMessage = custodianRequests.getSignedMessage(id);
  if (localSignedMessage?.id) {
    return {
      signedMessageId: localSignedMessage.id,
      url: `http://localhost:8000`,
      text: 'View Signed Message',
      action: 'view',
      showLink: true,
    };
  }
  return null;
};
