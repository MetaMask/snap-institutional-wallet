export type ECA1GetSignedMessageByIdResponse = {
  address: string;
  signature: string;
  status: {
    finished: boolean;
    signed: boolean;
    success: boolean;
    displayText: string;
    reason: string;
  };
};
