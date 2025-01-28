import { isValidHexAddress } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

/**
 * Gets the Etherscan link for an Ethereum address.
 *
 * @param address - The Ethereum address to get the Etherscan link for.
 * @returns The Etherscan URL for viewing the address details.
 */
export function getAccountLink(address: string) {
  // Used in address selector UI
  if (!isValidHexAddress(address as Hex)) {
    throw new Error('Invalid address');
  }

  return `https://etherscan.io/address/${address}`;
}
