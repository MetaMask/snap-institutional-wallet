type ITXParams = {
  from: string; // TODO: Might be possible to store the wallet_address_id in metamask and not have to translate this
  to: string;
  value?: string; // Wei
  data?: string;
  gasLimit: string;
  gas?: string; // what gas limit is called in metamask
  nonce?: number | string;
};

export type ILegacyTXParams = {
  gasPrice: string;
  type?: '0' | '1';
} & ITXParams;

export type IEIP1559TxParams = {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
  type: '2';
} & ITXParams;
