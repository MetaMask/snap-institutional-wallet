import { isUniqueAddress } from './is-unique-address';
import { CustodianType } from '../lib/types/CustodianType';

describe('isUniqueAddress', () => {
  it('should return true if the address is not in the array', () => {
    expect(isUniqueAddress('0x1234567890', [])).toBe(true);
  });

  it('should return false if the address is in the array', () => {
    expect(
      isUniqueAddress('0x1234567890', [
        {
          account: {
            address: '0x1234567890',
            type: 'eip155:eoa',
            id: '1',
            options: {
              custodian: {
                environmentName: 'test-custodian',
                displayName: 'custodian',
                deferPublication: false,
                importOrigin: 'test-origin',
              },
            },
            methods: [],
          },
          details: {
            custodianType: CustodianType.ECA3,
            custodianEnvironment: 'test',
            custodianApiUrl: 'https://api.custodian.com',
            custodianDisplayName: 'custodian',
            token: 'token',
            refreshTokenUrl: 'https://refresh.custodian.com',
          },
        },
      ]),
    ).toBe(false);
  });
});
