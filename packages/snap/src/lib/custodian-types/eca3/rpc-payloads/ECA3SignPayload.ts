import type { SignedMessageMetadata } from '../../../types/SignedMessageMetadata';
import type { SignedMessageParams } from '../../../types/SignedMessageParams';

export type ECA3SignedMessagePayload = [
  SignedMessageParams,
  SignedMessageMetadata,
];
