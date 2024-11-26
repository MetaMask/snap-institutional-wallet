export type ECA3GetTransactionLinkResponse = {
  transactionId: string;
  url: string;
  text: string;
  action: string;
  ethereum?: {
    accounts: string[];
    chainId: string[];
  };
};
