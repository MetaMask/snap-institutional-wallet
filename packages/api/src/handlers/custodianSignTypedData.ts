import custodianRequests from '../custodian/requests';
import type { SignTypedDataPayload } from '../types/rpc-payloads/SignTypedDataPayload';

export const custodianSignTypedData = async (
  payload: SignTypedDataPayload[0],
  _metadata: SignTypedDataPayload[1],
): Promise<string | null> => {
  console.log('custodianSignTypedData', payload);
  try {
    const { address, data } = payload;
    // add the signed message to the custodian requests
    const id = custodianRequests.addSignedMessage({
      address,
      message: data,
      version: 'signTypedData_v4',
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
