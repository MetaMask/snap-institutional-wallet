import { KeyringRpcMethod } from '@metamask/keyring-api';

import { isDevMode } from './dev-mode';
import { custodianMetadata } from './lib/custodian-types/custodianMetadata';

export enum InternalMethod {
  Onboard = 'authentication.onboard',
  ClearAllRequests = 'snap.internal.clearAllRequests',
  GetMutableTransactionParameters = 'transactions.getMutableTransactionParameters',
  GetConnectedAccounts = 'authentication.getConnectedAccounts',
  GetIsSupported = 'authentication.getIsSupported',
}

const metamaskPermissions = new Set<string>([
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.SubmitRequest,
  // Added by keyring-api v23. The client calls this after an account is
  // created. We don't implement it, so `handleKeyringRequest` answers with a
  // `MethodNotSupportedError`, which the client tolerates -- but the call has
  // to be allowed through to get that far.
  KeyringRpcMethod.SetSelectedAccounts,
  InternalMethod.GetMutableTransactionParameters,
]);

const metamask = 'metamask';

/**
 * Build the origin permission map for a given dev mode value.
 *
 * This is a pure function of `devMode` so that permissions cannot drift out of
 * sync with it. It used to be a mutable module-level map populated by an
 * `initPermissions()` call at import time -- which necessarily ran before dev
 * mode had been read from state, so the dev-only origins were always missing
 * until something happened to re-run it.
 *
 * @param devMode - Whether dev mode is enabled.
 * @returns A map of origin to the set of methods that origin may call.
 */
export function buildOriginPermissions(
  devMode: boolean,
): Map<string, Set<string>> {
  const originPermissions = new Map<string, Set<string>>();

  originPermissions.set(metamask, metamaskPermissions);

  custodianMetadata.forEach((custodian) => {
    if (custodian.allowedOnboardingDomains) {
      // exclude localhost

      if (!devMode && !custodian.production) {
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

  if (devMode) {
    originPermissions.set(
      'http://localhost:8000',
      new Set<string>([
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
      ]),
    );
  }

  return originPermissions;
}

// Memoised per dev mode value. Both variants are cheap and immutable once
// built, so this just avoids rebuilding on every request.
const cache = new Map<boolean, Map<string, Set<string>>>();

/**
 * Get the origin permissions for the current dev mode setting.
 *
 * @returns The origin permissions.
 */
export async function getOriginPermissions(): Promise<
  Map<string, Set<string>>
> {
  const devMode = await isDevMode();
  const cachedPermissions = cache.get(devMode);
  if (cachedPermissions) {
    return cachedPermissions;
  }
  const originPermissions = buildOriginPermissions(devMode);
  cache.set(devMode, originPermissions);
  return originPermissions;
}

/**
 * Verify if the caller can call the requested method.
 *
 * @param origin - Caller origin.
 * @param method - Method being called.
 * @returns True if the caller is allowed to call the method, false otherwise.
 */
export async function hasPermission(
  origin: string,
  method: string,
): Promise<boolean> {
  return (await getOriginPermissions()).get(origin)?.has(method) ?? false;
}
