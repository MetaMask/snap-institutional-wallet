import type { KeyringAccount } from '@metamask/keyring-api';

export type CustodialKeyringAccountOptions = {
  custodian: {
    environmentName: string;
    displayName: string;
    deferPublication: boolean;
    importOrigin: string;
  };
  accountName?: string;
};

export type CustodialKeyringAccount = KeyringAccount & {
  options: CustodialKeyringAccountOptions;
};
