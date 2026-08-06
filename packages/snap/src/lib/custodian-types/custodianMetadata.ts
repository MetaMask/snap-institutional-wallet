import { CustodianType } from '../types/CustodianType';

export type CustodianMetadata = {
  apiBaseUrl: string;
  refreshTokenUrl: string | null;
  name: string;
  legacyName?: string;
  displayName: string | null;
  production: boolean | null;
  hideFromUI?: boolean;
  apiVersion: CustodianType;
  custodianPublishesTransaction: boolean;
  iconUrl: string | null;
  isManualTokenInputSupported: boolean;
  onboardingUrl?: string;
  allowedOnboardingDomains?: string[];
};

// Enforce custodianPublishesTransaction to be true or false for ECA3 but true for everything else

type ECA3CustodianMetadata = CustodianMetadata & {
  apiVersion: CustodianType.ECA3;
  custodianPublishesTransaction: true | false;
};

type ECA1CustodianMetadata = CustodianMetadata & {
  apiVersion: CustodianType.ECA1;
  custodianPublishesTransaction: true;
};

export const custodianMetadata: (
  | ECA3CustodianMetadata
  | ECA1CustodianMetadata
)[] = [
  {
    refreshTokenUrl: 'http://localhost:8090/oauth/token',
    name: 'gk8-eca3-prod',
    displayName: 'GK8',
    production: true,
    apiBaseUrl: 'http://localhost:8090',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: true,
    iconUrl: 'https://www.gk8.io/wp-content/uploads/2021/04/6-layers-4.svg',
    isManualTokenInputSupported: true,
    onboardingUrl: 'https://www.gk8.io',
    allowedOnboardingDomains: [], // GK8 does not support onboarding via a web page
  },
  {
    refreshTokenUrl: 'https://zapi.custody.zodia.io/oauth/token',
    name: 'zodia-prod',
    displayName: 'Zodia',
    production: true,
    apiBaseUrl: 'https://zapi.custody.zodia.io',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl: 'https://zodia.io/wp-content/uploads/2023/01/cropped-ico.png',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://zodia.io',
    allowedOnboardingDomains: ['zodia.io', 'v2.custody.zodia.io'],
  },
  {
    refreshTokenUrl: 'https://api.sit.zodia.io/oauth/token',
    name: 'zodia-sit',
    displayName: 'Zodia SIT',
    production: false,
    apiBaseUrl: 'https://api.sit.zodia.io',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl: 'https://zodia.io/wp-content/uploads/2023/01/cropped-ico.png',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://zodia.io',
    allowedOnboardingDomains: ['sit.zodia.io', 'ui-v2.sit.zodia.io'],
  },
  {
    refreshTokenUrl: 'https://api-qa.qa.zodia.io/oauth/token',
    name: 'zodia-qa',
    displayName: 'Zodia QA',
    production: false,
    apiBaseUrl: 'https://api-qa.qa.zodia.io',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl: 'https://zodia.io/wp-content/uploads/2023/01/cropped-ico.png',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://zodia.io',
    allowedOnboardingDomains: ['qa.zodia.io', 'ui-v2.qa.zodia.io'],
  },
  {
    refreshTokenUrl: 'http://localhost:8090/oauth/token',
    name: 'gk8-eca3-dev',
    displayName: 'GK8',
    production: false,
    apiBaseUrl: 'http://localhost:8090',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: true,
    iconUrl: 'https://www.gk8.io/wp-content/uploads/2021/04/6-layers-4.svg',
    isManualTokenInputSupported: true,
    onboardingUrl: 'https://www.gk8.io',
    allowedOnboardingDomains: [], // GK8 does not support onboarding via a web page
  },
  {
    refreshTokenUrl: 'https://gamma.signer.cubist.dev/v0/oauth/token',
    name: 'cubist-gamma',
    displayName: 'Cubist Gamma',
    production: false,
    apiBaseUrl: 'https://gamma.signer.cubist.dev/v0/mmi',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://assets-global.website-files.com/638a2693daaf8527290065a3/651802cf8d04ec5f1a09ce86_Logo.svg',
    isManualTokenInputSupported: true,
    allowedOnboardingDomains: ['app-gamma.signer.cubist.dev'],
  },
  {
    refreshTokenUrl: 'https://beta.signer.cubist.dev/v0/oauth/token',
    name: 'cubist-beta',
    displayName: 'Cubist Beta',
    production: false,
    apiBaseUrl: 'https://beta.signer.cubist.dev/v0/mmi',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://assets-global.website-files.com/638a2693daaf8527290065a3/651802cf8d04ec5f1a09ce86_Logo.svg',
    isManualTokenInputSupported: true,
    allowedOnboardingDomains: ['app-beta.signer.cubist.dev', 'localhost:3000'],
  },
  {
    refreshTokenUrl: 'https://dg5z0qnzb9s65.cloudfront.net/v0/oauth/token',
    name: 'cubist-test',
    displayName: 'Cubist Test',
    production: false,
    apiBaseUrl: 'https://dg5z0qnzb9s65.cloudfront.net/v0/mmi',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://assets-global.website-files.com/638a2693daaf8527290065a3/651802cf8d04ec5f1a09ce86_Logo.svg',
    isManualTokenInputSupported: true,
    allowedOnboardingDomains: [],
  },
  {
    refreshTokenUrl: 'https://prod.signer.cubist.dev/v0/oauth/token',
    name: 'cubist-prod',
    displayName: 'Cubist',
    production: true,
    apiBaseUrl: 'https://prod.signer.cubist.dev/v0/mmi',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://assets-global.website-files.com/638a2693daaf8527290065a3/651802cf8d04ec5f1a09ce86_Logo.svg',
    isManualTokenInputSupported: true,
    allowedOnboardingDomains: ['app.signer.cubist.dev'],
  },
  {
    refreshTokenUrl: 'http://localhost:3330/oauth/token',
    apiBaseUrl: 'http://localhost:3330',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: false,
    name: 'local-dev',
    displayName: 'Local Dev',
    production: false,
    iconUrl:
      'https://dev.metamask-institutional.io/custodian-icons/neptune-icon.svg',
    isManualTokenInputSupported: true,
    allowedOnboardingDomains: ['localhost:8000', 'http://localhost:8000'],
  },
];
