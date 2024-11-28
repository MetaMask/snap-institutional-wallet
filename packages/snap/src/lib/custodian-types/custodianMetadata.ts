enum CustodianApiVersions {
  BitGo = -2,
  Cactus = -1,
  JSONRPC = 1, // ECA-1
  ECA3 = 3, // ECA-3
}

export type CustodianMetadata = {
  apiBaseUrl: string;
  refreshTokenUrl: string | null;
  name: string;
  legacyName?: string;
  displayName: string | null;
  enabled: boolean | null;
  apiVersion: CustodianApiVersions;
  custodianPublishesTransaction: boolean;
  iconUrl: string | null;
  isManualTokenInputSupported: boolean;
  onboardingUrl?: string;
};

export const custodianMetadata: CustodianMetadata[] = [
  {
    refreshTokenUrl: null,
    name: 'bitgo-test',
    displayName: 'BitGo Test',
    enabled: false,
    apiBaseUrl: 'https://app.bitgo-test.com/defi/v2',
    apiVersion: CustodianApiVersions.BitGo,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://dashboard.metamask-institutional.io/custodian-icons/bitgo-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://app.bitgo.com',
  },
  {
    refreshTokenUrl: null,
    name: 'bitgo-prod',
    legacyName: 'bitgo',
    displayName: 'BitGo',
    enabled: true,
    apiBaseUrl: 'https://app.bitgo.com/defi/v2',
    apiVersion: CustodianApiVersions.BitGo,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://dashboard.metamask-institutional.io/custodian-icons/bitgo-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://app.bitgo.com',
  },
  {
    refreshTokenUrl: null,
    name: 'cactus',
    displayName: 'Cactus Custody',
    enabled: true,
    apiVersion: CustodianApiVersions.Cactus,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://dashboard.metamask-institutional.io/custodian-icons/cactus-icon.svg',
    isManualTokenInputSupported: false,
    apiBaseUrl: 'https://api.mycactus.com/custody/v1/mmi-api',
    onboardingUrl: 'https://www.mycactus.com',
  },
  {
    refreshTokenUrl: 'http://localhost:8090/oauth/token',
    name: 'gk8-prod',
    displayName: 'GK8 ECA-1',
    enabled: true,
    apiBaseUrl: 'http://localhost:8090',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl: 'https://www.gk8.io/wp-content/uploads/2021/04/6-layers-4.svg',
    isManualTokenInputSupported: true,
    onboardingUrl: 'https://www.gk8.io',
  },
  {
    refreshTokenUrl: 'http://localhost:8090/oauth/token',
    name: 'gk8-eca3-prod',
    displayName: 'GK8 ECA-3',
    enabled: true,
    apiBaseUrl: 'http://localhost:8090',
    apiVersion: CustodianApiVersions.ECA3,
    custodianPublishesTransaction: true,
    iconUrl: 'https://www.gk8.io/wp-content/uploads/2021/04/6-layers-4.svg',
    isManualTokenInputSupported: true,
    onboardingUrl: 'https://www.gk8.io',
  },
  {
    refreshTokenUrl:
      'https://safe-mmi.staging.gnosisdev.com/api/v1/oauth/token/',
    name: 'gnosis-safe-dev',
    displayName: 'Safe',
    enabled: false,
    apiBaseUrl: 'https://safe-mmi.staging.gnosisdev.com/api',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://raw.githubusercontent.com/safe-global/safe-react/dev/public/resources/logo.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://safe.global',
  },
  {
    refreshTokenUrl: 'https://safe-mmi.safe.global/api/v1/oauth/token/',
    name: 'safe-prod',
    displayName: 'Safe',
    enabled: true,
    apiBaseUrl: 'https://safe-mmi.safe.global/api',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://raw.githubusercontent.com/safe-global/safe-react/dev/public/resources/logo.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://safe.global',
  },
  {
    refreshTokenUrl: 'https://safe-mmi.staging.5afe.dev/api/v1/oauth/token/',
    name: 'gnosis-safe-staging',
    displayName: 'Gnosis Safe Staging',
    enabled: false,
    apiBaseUrl: 'https://safe-mmi.staging.5afe.dev/api',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://raw.githubusercontent.com/safe-global/safe-react/dev/public/resources/logo.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://safe.global',
  },
  {
    refreshTokenUrl:
      'https://saturn-custody.metamask-institutional.io/oauth/token',
    name: 'saturn-prod',
    displayName: 'Saturn Custody',
    enabled: false,
    apiBaseUrl: 'https://saturn-custody.metamask-institutional.io/eth',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl: 'https://saturn-custody-ui.metamask-institutional.io/saturn.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://saturn-custody-ui.metamask-institutional.io',
  },
  {
    refreshTokenUrl: 'https://api.mpcvault.com/mmi/token-refresh',
    name: 'mpcvault-prod',
    displayName: 'MPCVault',
    enabled: true,
    apiBaseUrl: 'https://api.mpcvault.com/mmi',
    apiVersion: CustodianApiVersions.ECA3,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/mpcvault-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://console.mpcvault.com/',
  },
  {
    refreshTokenUrl:
      'https://neptune-custody.metamask-institutional.io/oauth/token',
    name: 'neptune-custody-prod',
    displayName: 'Neptune Custody',
    enabled: false,
    apiBaseUrl: 'https://neptune-custody.metamask-institutional.io/eth',
    apiVersion: CustodianApiVersions.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/neptune-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://neptune-custody-ui.metamask-institutional.io',
  },
  {
    refreshTokenUrl: 'https://api-preprod.uat.zodia.io/oauth/token',
    name: 'zodia-preprod',
    displayName: 'Zodia Preprod',
    enabled: false,
    apiBaseUrl: 'https://api-preprod.uat.zodia.io',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl: 'https://zodia.io/wp-content/uploads/2023/01/cropped-ico.png',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://zodia.io',
  },
  {
    refreshTokenUrl: 'https://mmi.fireblocks.io/v1/auth/access',
    name: 'fireblocks-prod',
    displayName: 'Fireblocks',
    enabled: true,
    apiBaseUrl: 'https://mmi.fireblocks.io',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl:
      'https://metamask-institutional.io/custodian-icons/fireblocks-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://console.fireblocks.io/v2/',
  },
  {
    refreshTokenUrl: 'https://zapi.custody.zodia.io/oauth/token',
    name: 'zodia-prod',
    displayName: 'Zodia',
    enabled: true,
    apiBaseUrl: 'https://zapi.custody.zodia.io',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl: 'https://zodia.io/wp-content/uploads/2023/01/cropped-ico.png',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://zodia.io',
  },
  {
    refreshTokenUrl: 'https://api.sit.zodia.io/oauth/token',
    name: 'zodia-sit',
    displayName: 'Zodia SIT',
    enabled: false,
    apiBaseUrl: 'https://api.sit.zodia.io',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl: 'https://zodia.io/wp-content/uploads/2023/01/cropped-ico.png',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://zodia.io',
  },
  {
    refreshTokenUrl:
      'https://saturn-custody.dev.metamask-institutional.io/oauth/token',
    name: 'saturn-dev',
    displayName: 'Saturn Custody',
    enabled: false,
    apiBaseUrl: 'https://saturn-custody.dev.metamask-institutional.io/eth',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://saturn-custody-ui.dev.metamask-institutional.io',
  },
  {
    refreshTokenUrl: 'https://api-qa.qa.zodia.io/oauth/token',
    name: 'zodia-qa',
    displayName: 'Zodia QA',
    enabled: false,
    apiBaseUrl: 'https://api-qa.qa.zodia.io',
    apiVersion: CustodianApiVersions.JSONRPC,
    custodianPublishesTransaction: true,
    iconUrl: 'https://zodia.io/wp-content/uploads/2023/01/cropped-ico.png',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://zodia.io',
  },
  {
    refreshTokenUrl: 'http://localhost:8090/oauth/token',
    name: 'gk8-eca3-dev',
    displayName: 'GK8',
    enabled: false,
    apiBaseUrl: 'http://localhost:8090',
    apiVersion: CustodianApiVersions.ECA3,
    custodianPublishesTransaction: true,
    iconUrl: 'https://www.gk8.io/wp-content/uploads/2021/04/6-layers-4.svg',
    isManualTokenInputSupported: true,
    onboardingUrl: 'https://www.gk8.io',
  },
  {
    refreshTokenUrl: 'https://api.dev.mpcvault.com/mmi/token-refresh',
    name: 'mpcvault-dev',
    displayName: 'MPCVault',
    enabled: false,
    apiBaseUrl: 'https://api.dev.mpcvault.com/mmi',
    apiVersion: CustodianApiVersions.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://dev.metamask-institutional.io/custodian-icons/mpcvault-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://console.mpcvault.com/',
  },
  {
    refreshTokenUrl: 'https://gamma.signer.cubist.dev/v0/oauth/token',
    name: 'cubist-gamma',
    displayName: 'Cubist Gamma',
    enabled: false,
    apiBaseUrl: 'https://gamma.signer.cubist.dev/v0/mmi',
    apiVersion: CustodianApiVersions.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://assets-global.website-files.com/638a2693daaf8527290065a3/651802cf8d04ec5f1a09ce86_Logo.svg',
    isManualTokenInputSupported: true,
  },
  {
    refreshTokenUrl: 'https://dg5z0qnzb9s65.cloudfront.net/v0/oauth/token',
    name: 'cubist-test',
    displayName: 'Cubist Test',
    enabled: false,
    apiBaseUrl: 'https://dg5z0qnzb9s65.cloudfront.net/v0/mmi',
    apiVersion: CustodianApiVersions.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://assets-global.website-files.com/638a2693daaf8527290065a3/651802cf8d04ec5f1a09ce86_Logo.svg',
    isManualTokenInputSupported: true,
  },
  {
    refreshTokenUrl:
      'https://neptune-custody.dev.metamask-institutional.io/oauth/token',
    name: 'neptune-custody-dev',
    displayName: 'Neptune Custody Dev',
    enabled: true,
    apiBaseUrl: 'https://neptune-custody.dev.metamask-institutional.io/eth',
    apiVersion: CustodianApiVersions.ECA3,
    custodianPublishesTransaction: false,
    iconUrl:
      'https://dev.metamask-institutional.io/custodian-icons/neptune-icon.svg',
    isManualTokenInputSupported: false,
    onboardingUrl: 'https://neptune-custody-ui.dev.metamask-institutional.io',
  },
];
