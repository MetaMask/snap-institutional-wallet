/**
 *
 * @param num
 */
export function hexlify(num: string | number): string {
  return `0x${BigInt(num).toString(16)}`;
}
