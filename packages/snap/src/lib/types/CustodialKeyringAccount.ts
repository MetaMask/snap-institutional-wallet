import type { KeyringAccount } from '@metamask/keyring-api';

export type CustodialKeyringAccountOptions = {
  custodian: {
    displayName: string;
    deferPublication: boolean;
  };
};

export type CustodialKeyringAccount = KeyringAccount & {
  options: CustodialKeyringAccountOptions;
};
