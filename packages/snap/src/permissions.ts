import { KeyringRpcMethod } from '@metamask/keyring-api';

import config from './config';
import { custodianMetadata } from './lib/custodian-types/custodianMetadata';

export enum InternalMethod {
  Onboard = 'authentication.onboard',
  ClearAllRequests = 'snap.internal.clearAllRequests',
}

const originPermissions = new Map<string, string[]>([
  [
    'metamask',
    [
      // Keyring methods
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.FilterAccountChains,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.GetRequest,
      KeyringRpcMethod.SubmitRequest,
      KeyringRpcMethod.RejectRequest,
    ],
  ],
]);

custodianMetadata.forEach((custodian) => {
  if (custodian.allowedOnboardingDomains) {
    // exclude localhost
    custodian.allowedOnboardingDomains.forEach((domain) => {
      originPermissions.set(domain, [InternalMethod.Onboard]);
      originPermissions.set(`https://${domain}`, [InternalMethod.Onboard]);
    });
  }
});

// Add localhost to the originPermissions
const localhostPermissions = [
  // Keyring methods
  KeyringRpcMethod.ListAccounts,
  KeyringRpcMethod.GetAccount,
  KeyringRpcMethod.CreateAccount,
  KeyringRpcMethod.FilterAccountChains,
  KeyringRpcMethod.UpdateAccount,
  KeyringRpcMethod.DeleteAccount,
  KeyringRpcMethod.ExportAccount,
  KeyringRpcMethod.ListRequests,
  KeyringRpcMethod.GetRequest,
  KeyringRpcMethod.ApproveRequest,
  KeyringRpcMethod.RejectRequest,
  // Custom methods
  InternalMethod.Onboard,
  InternalMethod.ClearAllRequests,
];

if (config.dev) {
  originPermissions.set('http://localhost:8000', localhostPermissions);
}

export { originPermissions };
