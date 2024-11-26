type Status = {
  finished: boolean;
  signed: boolean;
  success: boolean;
  displayText: string;
  reason: string;
};
export type ITransactionStatus = {
  submitted: boolean;
} & Status;
