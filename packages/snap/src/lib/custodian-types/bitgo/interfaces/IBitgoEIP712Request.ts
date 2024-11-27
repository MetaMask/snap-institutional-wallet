import type { MessageTypes, TypedMessage } from '../../../types/ITypedMessage';

export type IBitgoEIP712Request = {
  address: string;
  payload: TypedMessage<MessageTypes>;
  encodingVersion: string;
};
