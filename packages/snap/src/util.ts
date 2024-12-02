import { Common, Hardfork } from '@ethereumjs/common';

import type { ITransactionDetails } from './lib/types';
import type { Wallet } from './lib/types/CustodialKeyring';

/**
 * Validates whether there are no duplicate addresses in the provided array of wallets.
 *
 * @param address - The address to validate for duplication.
 * @param wallets - The array of wallets to search for duplicate addresses.
 * @returns Returns true if no duplicate addresses are found, otherwise false.
 */
export function isUniqueAddress(address: string, wallets: Wallet[]): boolean {
  return !wallets.find((wallet) => wallet.account.address === address);
}

/**
 * Throws an error with the specified message.
 *
 * @param message - The error message.
 */
export function throwError(message: string): never {
  throw new Error(message);
}

/**
 * Runs the specified callback and throws an error with the specified message
 * if it fails.
 *
 * This function should be used to run code that may throw error messages that
 * could expose sensitive information.
 *
 * @param callback - Callback to run.
 * @param message - Error message to throw if the callback fails.
 * @returns The result of the callback.
 */
export function runSensitive<Type>(
  callback: () => Type,
  message?: string,
): Type {
  try {
    return callback();
  } catch (error) {
    throw new Error(message ?? 'An unexpected error occurred');
  }
}

/**
 * Converts a hexadecimal chain ID to a CAIP-20 chain ID.
 *
 * @param chainId - The hexadecimal chain ID.
 * @returns The CAIP-20 chain ID.
 */
export function convertHexChainIdToCaip2Decimal(chainId: string): string {
  return `eip155:${parseInt(chainId, 16)}`;
}
export const formatTransactionData = (
  data: string | Uint8Array | undefined,
): string | undefined => {
  if (!data || data === '0x') {
    return undefined;
  }

  if (typeof data === 'string') {
    return data.startsWith('0x') ? data : `0x${data}`;
  }

  return `0x${Buffer.from(data).toString('hex')}`;
};

export const createCommon = (
  transaction: ITransactionDetails,
  chainId: string,
): Common => {
  return Common.custom(
    // eslint-disable-next-line radix
    { chainId: parseInt(chainId) },
    {
      hardfork:
        transaction.maxPriorityFeePerGas || transaction.maxFeePerGas
          ? Hardfork.London
          : Hardfork.Istanbul,
    },
  );
};

/**
 * Truncates the address to show only the first 6 and last 4 characters.
 *
 * @param address - The address to truncate.
 * @returns The truncated address.
 */
export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Gets the Etherscan link for an Ethereum address.
 *
 * @param address - The Ethereum address to get the Etherscan link for.
 * @returns The Etherscan URL for viewing the address details.
 */
export function getAccountLink(address: string) {
  return `https://etherscan.io/address/${address}`;
}
