type Label = {
  key: string;
  value: string;
};

export type IEthereumAccount<CustodianType> = {
  name: string;
  address: string;
  custodianDetails: CustodianType | null;
  labels?: Label[];
  balance?: string;
};
