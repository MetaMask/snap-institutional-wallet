export { defaultSnapOrigin } from './snap';

export const defaultCustodianApiUrl =
  process.env.CUSTODIAN_API_URL ?? 'http://localhost:3330';
export const defaultRefreshTokenUrl =
  process.env.REFRESH_TOKEN_URL ?? 'http://localhost:3330/oauth/token';
