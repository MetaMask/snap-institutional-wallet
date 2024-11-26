export { defaultSnapOrigin } from './snap';

export const custodianApiUrl =
  process.env.CUSTODIAN_API_URL ?? 'http://localhost:3330';
export const refreshTokenUrl =
  process.env.REFRESH_TOKEN_URL ?? 'http://localhost:3330/oauth/token';
