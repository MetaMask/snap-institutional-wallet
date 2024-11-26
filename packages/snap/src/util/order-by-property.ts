import BigNumber from 'bignumber.js';

/**
 *
 * @param field
 */
export function orderByProperty(field: string) {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return function (a: any, b: any): number {
    const aValue = new BigNumber(a[field]);
    const bValue = new BigNumber(b[field]);

    if (aValue.lt(bValue)) {
      return -1;
    } else if (aValue.gt(bValue)) {
      return 1;
    }
    return 0;
  };
}
