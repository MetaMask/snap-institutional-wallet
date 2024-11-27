export type ISignedMessageDetails = {
  id: string;
  signature: string | null;
  status: SignedMessageStatus;
  from?: string;
};

type SignedMessageStatus = {
  finished: boolean;
  signed: boolean;
  success: boolean;
  displayText: string;
  reason?: string;
};
