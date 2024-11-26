import type { SignedTypedMessageMetadata } from '../../../types';
import type { SignedTypedMessageParams } from '../../../types/SignedTypedMessageParams';

export type ECA3SignTypedDataPayload = [
  SignedTypedMessageParams,
  SignedTypedMessageMetadata,
];
