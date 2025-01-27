import { runSensitive } from './run-sensitive';

describe('runSensitive', () => {
  it('should run the callback and return the result', () => {
    expect(runSensitive(() => 1)).toBe(1);
  });

  it('should throw a custom error if the callback fails', () => {
    expect(() =>
      runSensitive(() => {
        throw new Error('Test error');
      }, 'Custom error'),
    ).toThrow('Custom error');
  });

  it('should throw a default error if no message is provided', () => {
    expect(() =>
      runSensitive(() => {
        throw new Error('Test error');
      }),
    ).toThrow('An unexpected error occurred');
  });
});
