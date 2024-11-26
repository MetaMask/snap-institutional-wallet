import type { MessageTypes, TypedMessage } from '../../../types/ITypedMessage';

export type ECA1SignTypedDataPayload = [
  string,
  TypedMessage<MessageTypes>,
  string,
];
