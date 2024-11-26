export type CustodianDeepLink = {
  id: string;
  url: string;
  text: string;
  action: string;
  ethereum?: {
    accounts: string[];
    chainId: string[];
  };
};
