import { KeyringRpcMethod } from '@metamask/keyring-api';

import config from './config';
import { custodianMetadata } from './lib/custodian-types/custodianMetadata';

export enum InternalMethod {
  Onboard = 'authentication.onboard',
  ClearAllRequests = 'snap.internal.clearAllRequests',
}

const metamaskPermissions = new Set([
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.SubmitRequest,
]);

const metamask = 'metamask';

export const originPermissions = new Map<string, Set<string>>([]);

originPermissions.set(metamask, metamaskPermissions);

custodianMetadata.forEach((custodian) => {
  if (custodian.allowedOnboardingDomains) {
    // exclude localhost

    if (!config.dev && !custodian.production) {
      return;
    }

    custodian.allowedOnboardingDomains.forEach((domain) => {
      // Due to a quirk of the snap SDK, we need to allow the onboarding domain as a bare domain
      originPermissions.set(domain, new Set([InternalMethod.Onboard]));
      originPermissions.set(
        `https://${domain}`,
        new Set([InternalMethod.Onboard]),
      );
    });
  }
});

// Add localhost to the originPermissions
const localhostPermissions = new Set([
  // Keyring methods
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.UpdateAccount,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  // Custom methods
  InternalMethod.Onboard,
  InternalMethod.ClearAllRequests,
]);

if (config.dev) {
  originPermissions.set('http://localhost:8000', localhostPermissions);
}
