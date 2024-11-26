export type ICactusEthereumAccount = {
  name: string;
  address: string;
  labels: string[];
  balance: string;
  chainId: number;
  custodianDetails: {
    domainId: string;
    projectId: string;
    walletId: string;
  };
};
