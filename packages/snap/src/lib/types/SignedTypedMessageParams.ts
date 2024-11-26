import type { MessageTypes, TypedMessage } from 'src/interfaces/ITypedMessage';

export type SignedTypedMessageParams = {
  address: string;
  data: TypedMessage<MessageTypes>;
  version?: string;
};
