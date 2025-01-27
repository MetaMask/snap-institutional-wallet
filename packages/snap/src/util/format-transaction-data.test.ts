import { formatTransactionData } from './format-transaction-data';

describe('formatTransactionData', () => {
  it('should format a transaction data string', () => {
    expect(formatTransactionData('0x1234567890')).toBe('0x1234567890');
  });

  it('should format a transaction data Uint8Array', () => {
    expect(formatTransactionData(new Uint8Array([1, 2, 3]))).toBe('0x010203');
  });

  it('should return undefined if the transaction data is undefined', () => {
    expect(formatTransactionData(undefined)).toBeUndefined();
  });
});
