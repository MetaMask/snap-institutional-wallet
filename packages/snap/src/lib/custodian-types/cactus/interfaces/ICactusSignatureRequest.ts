import type { MessageTypes, TypedMessage } from '../../../types/ITypedMessage';

export type ICactusSignatureRequest = {
  address: string;
  signatureVersion: string;
  payload:
    | TypedMessage<MessageTypes>
    | {
        message: string;
      };
};
