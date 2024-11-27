/**
 * Convert a number to a hex string.
 *
 * @param numberToHexlify - The number to convert.
 * @returns The hex string.
 */
export function hexlify(numberToHexlify: string | number): string {
  return `0x${BigInt(numberToHexlify).toString(16)}`;
}
