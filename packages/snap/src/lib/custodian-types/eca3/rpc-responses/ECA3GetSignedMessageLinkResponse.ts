export type ECA3GetSignedMessageLinkResponse = {
  signedMessageId: string;
  url: string;
  text: string;
  action: string;
  ethereum?: {
    accounts: string[];
    chainId: string[];
  };
};
