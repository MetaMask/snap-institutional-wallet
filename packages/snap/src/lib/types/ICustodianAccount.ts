import type { AuthDetails } from '.';

type Label = {
  key: string;
  value: string;
};

// This is a horrible mess

type ICustodianAccountProto = {
  name?: string;
  address: string;
  custodianDetails: any;
  labels: Label[];
  /** @deprecated */
  apiUrl: string;
  chainId?: number;
  custodyType: string;
  meta?: { version: number };
  envName: string;
};

// The type actually used in CustodyKeyring

export type ICustodianAccount<
  AuthDetailsType extends AuthDetails = AuthDetails,
> = {
  authDetails: AuthDetailsType;
} & ICustodianAccountProto;

// The type that's used in the extension, which is agnostic to authType
