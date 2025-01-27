import { truncateAddress } from './truncate-address';

describe('truncateAddress', () => {
  it('should truncate the address', () => {
    expect(truncateAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(
      '0xd8da...6045',
    );
  });

  it('should throw an error if the address is invalid', () => {
    expect(() => truncateAddress('0x1234567890')).toThrow('Invalid address');
  });
});
