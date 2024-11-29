import { SignPayload } from '../types/rpc-payloads/SignPayload';
import custodianRequests from '../custodian/requests';

export const custodianSign = async (
  payload: SignPayload[0],
  metadata: SignPayload[1],
): Promise<string | null> => {
  try {
    const { address, message } = payload;
    const { chainId, originUrl, note } = metadata;

    // add the signed message to the custodian requests
    const id = custodianRequests.addSignedMessage({
      address,
      message,
      version: 'personal_sign',
      signature: null,
      status: {
        finished: false,
        signed: false,
        success: false,
        displayText: '',
      },
    });

    return id;
  } catch (error) {
    console.error(error);
    return null;
  }
};
