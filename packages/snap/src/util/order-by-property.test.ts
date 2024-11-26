import { orderByProperty } from './order-by-property';

describe('orderByProperty', () => {
  it('sorts an array of objects based on the numeric (bignumber) value field', () => {
    const arr = [
      { value: '100000000' },
      { value: '10000000000000000000000000000000000000000' },
      { value: '10000000000000000000000000000000000000000' },
      { value: '10' },
      {
        value: '1000000000000000000000000000000000000000000000000000000000000',
      },
    ];

    const sorted = arr.sort(orderByProperty('value'));

    expect(sorted).toEqual([
      { value: '10' },
      { value: '100000000' },
      { value: '10000000000000000000000000000000000000000' },
      { value: '10000000000000000000000000000000000000000' },
      {
        value: '1000000000000000000000000000000000000000000000000000000000000',
      },
    ]);
  });
});
