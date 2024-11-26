import type {
  MessageTypes,
  TypedMessage,
} from '../../../interfaces/ITypedMessage';

export type IBitgoEIP712Request = {
  address: string;
  payload: TypedMessage<MessageTypes>;
  encodingVersion: string;
};
