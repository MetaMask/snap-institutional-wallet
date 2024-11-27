// Shamelessley stolen from https://github.com/MetaMask/eth-sig-util/blob/master/src/index.ts

type MessageTypeProperty = {
  name: string;
  type: string;
};

export type MessageTypes = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  EIP712Domain: MessageTypeProperty[];
  [additionalProperties: string]: MessageTypeProperty[];
};

export type TypedMessage<MessageType extends MessageTypes> = {
  types: MessageType;
  primaryType: keyof MessageType;
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
  };
  message: Record<string, unknown>;
};
