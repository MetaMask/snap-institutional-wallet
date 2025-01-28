import type { Hex } from '@metamask/utils';
import { isValidHexAddress } from '@metamask/utils';

/**
 * Truncates the address to show only the first 6 and last 4 characters.
 *
 * @param address - The address to truncate.
 * @returns The truncated address.
 */
export function truncateAddress(address: string) {
  // Used in address selector UI
  if (!isValidHexAddress(address as Hex)) {
    throw new Error('Invalid address');
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
