import type {
  MessageTypes,
  TypedMessage,
} from '../../../interfaces/ITypedMessage';

export type ICactusSignatureRequest = {
  address: string;
  signatureVersion: string;
  payload:
    | TypedMessage<MessageTypes>
    | {
        message: string;
      };
};
