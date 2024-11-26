import type { CustodianType } from './CustodianType';

export type OnBoardingRpcRequest = {
  custodianType: CustodianType;
  custodianEnvironment: string;
  custodianApiUrl: string;
  custodianDisplayName: string;
  apiUrl: string;
  token: string;
  refreshTokenUrl: string;
};
