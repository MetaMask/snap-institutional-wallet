import type { ITransactionStatus } from './ITransactionStatus';

export type ITransactionStatusMap = {
  [custodyStatus: string]: ITransactionStatus;
};
