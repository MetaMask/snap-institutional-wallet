import type { OnBoardingRpcRequest } from '../../lib/types/OnBoardingRpcRequest';

export type OnboardingAccount = { address: string; name: string };

export type OnboardingContext = {
  activity: string;
  request: OnBoardingRpcRequest;
  accounts: { name: string; address: string }[];
  selectedAccounts: OnboardingAccount[];
};
