import { Hardfork, Common } from '@ethereumjs/common';

import type { TransactionDetails } from '../lib/structs/CustodialKeyringStructs';

/**
 * Creates a Common instance for Ethereum transactions.
 *
 * @param transaction - The transaction details.
 * @param chainId - The chain ID.
 * @returns The Common instance.
 */
export const createCommon = (
  transaction: TransactionDetails,
  chainId: string,
): Common => {
  // eslint-disable-next-line radix
  const chainIdInt = parseInt(chainId);

  if (isNaN(chainIdInt)) {
    throw new Error(`Invalid chainId ${chainId}`);
  }

  return Common.custom(
    { chainId: chainIdInt },
    {
      hardfork:
        transaction.maxPriorityFeePerGas || transaction.maxFeePerGas
          ? Hardfork.London
          : Hardfork.Istanbul,
    },
  );
};
