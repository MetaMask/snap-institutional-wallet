import type { OnBoardingRpcRequest } from './OnBoardingRpcRequest';

export type OnboardingContext = {
  activity: 'onboarding';
  request: OnBoardingRpcRequest;
  accounts: { name: string; address: string }[];
};

export type CustodialSnapContext = OnboardingContext;
