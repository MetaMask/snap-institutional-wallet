/**
 * Converts a hexadecimal chain ID to a CAIP-20 chain ID.
 *
 * @param chainId - The hexadecimal chain ID.
 * @returns The CAIP-20 chain ID.
 */
export function convertHexChainIdToCaip2Decimal(chainId: string): string {
  const chainIdInt = parseInt(chainId, 16);

  if (isNaN(chainIdInt)) {
    throw new Error(`Invalid chainId ${chainId}`);
  }

  return `eip155:${chainIdInt}`;
}
