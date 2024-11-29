export interface GetTransactionLinkResponse {
  transactionId: string;
  url: string;
  text: string;
  action: string;
  showLink: boolean;
  ethereum?: {
    accounts: string[];
    chainId: string[];
  };
}
