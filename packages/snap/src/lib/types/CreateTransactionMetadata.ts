export type CreateTransactionMetadata = {
  chainId: string;
  note?: string;
  transactionCategory?: string;
  origin?: string;
  custodianPublishesTransaction: boolean;
  rpcUrl?: string;
};
