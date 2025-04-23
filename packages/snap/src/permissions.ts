import { KeyringRpcMethod } from '@metamask/keyring-api';

import config from './config';
import { custodianMetadata } from './lib/custodian-types/custodianMetadata';

export enum InternalMethod {
  Onboard = 'authentication.onboard',
  ClearAllRequests = 'snap.internal.clearAllRequests',
  GetMutableTransactionParameters = 'transactions.getMutableTransactionParameters',
  GetConnectedAccounts = 'authentication.getConnectedAccounts',
  GetIsSupported = 'authentication.getIsSupported',
}

const metamaskPermissions = new Set([
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.SubmitRequest,
  InternalMethod.GetMutableTransactionParameters,
]);

const metamask = 'metamask';

const originPermissions = new Map<string, Set<string>>();

/**
 * Initialize the origin permissions.
 */
export function initPermissions() {
  originPermissions.clear();

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
          new Set([
            InternalMethod.Onboard,
            InternalMethod.GetConnectedAccounts,
            InternalMethod.GetIsSupported,
          ]),
        );
        if (domain === 'localhost:3000') {
          originPermissions.set(
            'http://localhost:3000',
            new Set([InternalMethod.Onboard]),
          );
        }
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
    InternalMethod.GetConnectedAccounts,
    InternalMethod.GetIsSupported,
  ]);

  if (config.dev) {
    originPermissions.set('http://localhost:8000', localhostPermissions);
  }
}

/**
 * Get the origin permissions.
 *
 * @returns The origin permissions.
 */
export function getOriginPermissions(): Map<string, Set<string>> {
  return originPermissions;
}

/**
 * Verify if the caller can call the requested method.
 *
 * @param origin - Caller origin.
 * @param method - Method being called.
 * @returns True if the caller is allowed to call the method, false otherwise.
 */
export function hasPermission(origin: string, method: string): boolean {
  return originPermissions.get(origin)?.has(method) ?? false;
}

initPermissions();
