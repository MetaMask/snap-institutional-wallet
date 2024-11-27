import type { MessageTypes, TypedMessage } from './ITypedMessage';

export type SignedTypedMessageParams = {
  address: string;
  data: TypedMessage<MessageTypes>;
  version?: string;
};
