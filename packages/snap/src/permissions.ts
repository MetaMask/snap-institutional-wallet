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
    custodian.allowedOnboardingDomains.forEach((domain) => {
      // @audit - includes dev endpoints that should be excluded in prod
      originPermissions.set(domain, new Set([InternalMethod.Onboard])); // @audit - should enforce HTTPS (this is a trust module; no more insecure transports); check if https prefix, else add it
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
  InternalMethod.ClearAllRequests, // @audit-ok only local dev
]);

if (config.dev) {
  originPermissions.set('http://localhost:8000', localhostPermissions); // @audit-ok - remove for prod
}
