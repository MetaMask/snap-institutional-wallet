// this is designed to mimic the format of @metamask/contract-metadata
// since this data is to be used to augment the same

export type IMetamaskContractMetadata = {
  [address: string]: {
    name: string;
    logo: string;
    erc20: boolean;
    symbol: string;
    decimals: number;
  };
};
