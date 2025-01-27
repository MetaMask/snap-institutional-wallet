import { createCommon } from './create-common';
import type { TransactionDetails } from '../lib/structs/CustodialKeyringStructs';

describe('createCommon', () => {
  it('should create a Common instance', () => {
    expect(createCommon({} as TransactionDetails, '1')).toBeDefined();
  });
});
