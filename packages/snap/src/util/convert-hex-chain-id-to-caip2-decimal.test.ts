import { convertHexChainIdToCaip2Decimal } from './convert-hex-chain-id-to-caip2-decimal';

describe('convertHexChainIdToCaip2Decimal', () => {
  it('should convert a hexadecimal chain ID to a CAIP-20 chain ID', () => {
    expect(convertHexChainIdToCaip2Decimal('0x1')).toBe('eip155:1');
  });

  it('should throw an error if the chain ID is invalid', () => {
    expect(() => convertHexChainIdToCaip2Decimal('0xxyz')).toThrow(
      'Invalid chainId',
    );
  });
});
