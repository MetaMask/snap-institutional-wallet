type Label = {
  key: string;
  value: string;
};

export type IEthereumAccount<T> = {
  name: string;
  address: string;
  custodianDetails: T | null;
  labels?: Label[];
  balance?: string;
};
