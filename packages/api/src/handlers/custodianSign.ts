import custodianRequests from '../custodian/requests';
import type { SignPayload } from '../types/rpc-payloads/SignPayload';

export const custodianSign = async (
  payload: SignPayload[0],
  _metadata: SignPayload[1],
): Promise<string | null> => {
  console.log('custodianSign', payload);
  try {
    const { address, message } = payload;
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
