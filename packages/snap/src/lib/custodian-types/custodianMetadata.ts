import { CustodianType } from '../types/CustodianType';

export type CustodianMetadata = {
  apiBaseUrl: string;
  refreshTokenUrl: string | null;
  name: string;
  legacyName?: string;
  displayName: string | null;
  production: boolean | null;
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

type BitGoCustodianMetadata = CustodianMetadata & {
  apiVersion: CustodianType.BitGo;
  custodianPublishesTransaction: true;
};

type CactusCustodianMetadata = CustodianMetadata & {
  apiVersion: CustodianType.Cactus;
  custodianPublishesTransaction: true;
};

export const custodianMetadata: (
  | ECA3CustodianMetadata
  | ECA1CustodianMetadata
  | BitGoCustodianMetadata
  | CactusCustodianMetadata
)[] = [
  {
    refreshTokenUrl: null,
    name: 'bitgo-test',
    displayName: 'BitGo Test',
    production: false,
    apiBaseUrl: 'https://app.bitgo-test.com/defi/v2',
    apiVersion: CustodianType.BitGo,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://dashboard.metamask-institutional.io/custodian-icons/bitgo-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://app.bitgo-test.com',
    allowedOnboardingDomains: ['app.bitgo-test.com', 'localhost:3000'],
  },
  {
    refreshTokenUrl: null,
    name: 'bitgo-prod',
    legacyName: 'bitgo',
    displayName: 'BitGo',
    production: true,
    apiBaseUrl: 'https://app.bitgo.com/defi/v2',
    apiVersion: CustodianType.BitGo,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://dashboard.metamask-institutional.io/custodian-icons/bitgo-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://app.bitgo.com',
    allowedOnboardingDomains: ['app.bitgo.com'],
  },
  {
    refreshTokenUrl: null,
    name: 'cactus',
    displayName: 'Cactus Custody',
    production: true,
    apiVersion: CustodianType.Cactus,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://dashboard.metamask-institutional.io/custodian-icons/cactus-icon.svg',
    isManualTokenInputSupported: false,
    apiBaseUrl: 'https://api.mycactus.com/custody/v1/mmi-api',
    onboardingUrl: 'https://www.mycactus.com',
    allowedOnboardingDomains: [
      'www.mycactus.com',
      'www.mycactus.dev',
      'pre.mycactus.com',
      'debug.mycactus.dev:1443',
      'alpha.mycactus.io',
    ],
  },

  {
    refreshTokenUrl: 'http://localhost:8090/oauth/token',
    name: 'gk8-prod',
    displayName: 'GK8 ECA-1',
    production: false,
    apiBaseUrl: 'http://localhost:8090',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl: 'https://www.gk8.io/wp-content/uploads/2021/04/6-layers-4.svg',
    isManualTokenInputSupported: true,
    onboardingUrl: 'https://www.gk8.io',
    allowedOnboardingDomains: [], // GK8 does not support onboarding via a web page
  },
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
    refreshTokenUrl:
      'https://safe-mmi.staging.gnosisdev.com/api/v1/oauth/token/',
    name: 'gnosis-safe-dev',
    displayName: 'Safe',
    production: false,
    apiBaseUrl: 'https://safe-mmi.staging.gnosisdev.com/api',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://raw.githubusercontent.com/safe-global/safe-react/dev/public/resources/logo.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://safe.global',
    allowedOnboardingDomains: ['apps-portal.safe.global'],
  },
  {
    refreshTokenUrl: 'https://safe-mmi.safe.global/api/v1/oauth/token/',
    name: 'safe-prod',
    displayName: 'Safe',
    production: true,
    apiBaseUrl: 'https://safe-mmi.safe.global/api',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://raw.githubusercontent.com/safe-global/safe-react/dev/public/resources/logo.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://safe.global',
    allowedOnboardingDomains: ['apps-portal.safe.global'],
  },
  {
    refreshTokenUrl: 'https://safe-mmi.staging.5afe.dev/api/v1/oauth/token/',
    name: 'gnosis-safe-staging',
    displayName: 'Gnosis Safe Staging',
    production: false,
    apiBaseUrl: 'https://safe-mmi.staging.5afe.dev/api',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://raw.githubusercontent.com/safe-global/safe-react/dev/public/resources/logo.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://safe.global',
    allowedOnboardingDomains: ['apps-portal.safe.global'],
  },
  {
    refreshTokenUrl:
      'https://saturn-custody.metamask-institutional.io/oauth/token',
    name: 'saturn-prod',
    displayName: 'Saturn Custody',
    production: false,
    apiBaseUrl: 'https://saturn-custody.metamask-institutional.io/eth',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl: 'https://saturn-custody-ui.metamask-institutional.io/saturn.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://saturn-custody-ui.metamask-institutional.io',
    allowedOnboardingDomains: ['saturn-custody-ui.metamask-institutional.io'],
  },
  {
    refreshTokenUrl: 'https://api.mpcvault.com/mmi/token-refresh',
    name: 'mpcvault-prod',
    displayName: 'MPCVault',
    production: true,
    apiBaseUrl: 'https://api.mpcvault.com/mmi',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/mpcvault-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://console.mpcvault.com/',
    allowedOnboardingDomains: ['console.mpcvault.com'],
  },
  {
    refreshTokenUrl:
      'https://neptune-custody.metamask-institutional.io/oauth/token',
    name: 'neptune-custody-prod',
    displayName: 'Neptune Custody',
    production: false,
    apiBaseUrl: 'https://neptune-custody.metamask-institutional.io/eth',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/neptune-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://neptune-custody-ui.metamask-institutional.io',
    allowedOnboardingDomains: ['neptune-custody-ui.metamask-institutional.io'],
  },
  {
    refreshTokenUrl: 'https://api-preprod.uat.zodia.io/oauth/token',
    name: 'zodia-preprod',
    displayName: 'Zodia Preprod',
    production: false,
    apiBaseUrl: 'https://api-preprod.uat.zodia.io',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl: 'https://zodia.io/wp-content/uploads/2023/01/cropped-ico.png',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://zodia.io',
    allowedOnboardingDomains: ['ui-preprod-v2.uat.zodia.io'],
  },
  {
    refreshTokenUrl: 'https://mmi.fireblocks.io/v1/auth/access',
    name: 'fireblocks-prod',
    displayName: 'Fireblocks',
    production: true,
    apiBaseUrl: 'https://mmi.fireblocks.io',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/fireblocks-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://console.fireblocks.io/v2/',
    allowedOnboardingDomains: ['console.fireblocks.io'],
  },
  {
    refreshTokenUrl: 'https://local.waterballoons.xyz:4200/v1/auth/access',
    name: 'waterballoons-local',
    displayName: 'Waterballoons',
    production: false,
    apiBaseUrl: 'https://local.waterballoons.xyz:4200',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/neptune-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://local.waterballoons.xyz:4200',
    allowedOnboardingDomains: ['local.waterballoons.xyz:4200'],
  },
  {
    refreshTokenUrl: 'https://local.waterballoons.xyz:4200/v1/auth/access',
    name: 'waterballoons-dev10',
    displayName: 'Waterballoons 10',
    production: false,
    apiBaseUrl: 'https://dev4-console-api.waterballoons.xyz',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/neptune-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://dev10-console.waterballoons.xyz',
    allowedOnboardingDomains: ['dev10-console.waterballoons.xyz'],
  },
  {
    refreshTokenUrl: 'https://local.waterballoons.xyz:4200/v1/auth/access',
    name: 'waterballoons-dev4',
    displayName: 'Waterballoons 4',
    production: false,
    apiBaseUrl: 'https://dev4-console-api.waterballoons.xyz',
    apiVersion: CustodianType.ECA1,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/neptune-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://dev4-console.waterballoons.xyz',
    allowedOnboardingDomains: ['dev4-console.waterballoons.xyz'],
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
    refreshTokenUrl: 'https://api.dev.mpcvault.com/mmi/token-refresh',
    name: 'mpcvault-dev',
    displayName: 'MPCVault',
    production: false,
    apiBaseUrl: 'https://api.dev.mpcvault.com/mmi',
    apiVersion: CustodianType.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://dev.metamask-institutional.io/custodian-icons/mpcvault-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://console.mpcvault.com/',
    allowedOnboardingDomains: ['console.dev.mpcvault.com'],
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
    allowedOnboardingDomains: [], // Cubist does not support onboarding via a web page
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
    allowedOnboardingDomains: [], // Cubist does not support onboarding via a web page
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
