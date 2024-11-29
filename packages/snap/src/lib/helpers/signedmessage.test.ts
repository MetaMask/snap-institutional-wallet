/* eslint-disable @typescript-eslint/naming-convention */

import { ICustodianApi } from '../types/ICustodianApi';
import { SignedMessageHelper } from './signedmessage';

describe('Signed message Helper', () => {
  describe('signTypedData', () => {
    it('should call signTypedData_v4', async () => {
      const custodianApi = {
        signTypedData_v4: jest.fn().mockResolvedValue('ok'),
      };

      const signedMessage = await SignedMessageHelper.signTypedData(
        '0x123',
        {
          types: {
            EIP712Domain: [],
            Test: [],
          },
          primaryType: 'Test',
          domain: {},
          message: {},
        },
        custodianApi as ICustodianApi,
      );

      expect(custodianApi.signTypedData_v4).toHaveBeenCalled();
    });
  });
});
