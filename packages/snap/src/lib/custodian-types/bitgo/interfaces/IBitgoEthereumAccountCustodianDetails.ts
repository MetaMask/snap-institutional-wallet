import type { IEthereumAccountCustodianDetails } from '../../../types';

export type IBitgoEthereumAccountCustodianDetails = {
  accountId: string;
  coinId: string;
} & IEthereumAccountCustodianDetails;
