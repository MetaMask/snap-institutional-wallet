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
