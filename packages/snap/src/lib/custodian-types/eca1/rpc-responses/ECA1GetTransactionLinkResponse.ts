export type ECA1GetTransactionLinkResponse = {
  transactionId: string;
  url: string;
  text: string;
  action: string;
  ethereum?: {
    accounts: string[];
    chainId: string[];
  };
};
