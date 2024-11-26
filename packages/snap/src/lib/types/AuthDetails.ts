import type { IRefreshTokenAuthDetails } from './IRefreshTokenAuthDetails';
import type { ITokenAuthDetails } from './ITokenAuthDetails';

export type AuthDetails = ITokenAuthDetails | IRefreshTokenAuthDetails;
