import { hexlify } from './hexlify';

describe('hexlify', () => {
  it('should convert a number to hex and 0x-prefix it', () => {
    expect(hexlify(1)).toBe('0x1');
    expect(hexlify(2)).toBe('0x2');
    expect(hexlify(3)).toBe('0x3');
    expect(hexlify('4')).toBe('0x4');
    expect(hexlify('0x5')).toBe('0x5');
  });
});
