import type { IEthereumAccountCustodianDetails } from '../../../types';

export type ICactusEthereumAccountCustodianDetails = {
  walletId: string;
  chainId?: number;
} & IEthereumAccountCustodianDetails;
