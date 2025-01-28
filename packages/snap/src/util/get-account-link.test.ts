import { getAccountLink } from './get-account-link';

describe('getAccountLink', () => {
  it('should return the Etherscan link for a valid address', () => {
    expect(getAccountLink('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')).toBe(
      'https://etherscan.io/address/0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    );
  });

  it('should throw an error if the address is invalid', () => {
    expect(() => getAccountLink('0x1234567890')).toThrow('Invalid address');
  });
});
