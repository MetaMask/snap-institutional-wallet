import { Mutex } from 'async-mutex';

import { acquireLock } from './lock';

jest.mock('async-mutex', () => {
  return {
    Mutex: jest.fn().mockImplementation(() => ({
      // Mock implementation of Mutex if needed
    })),
  };
});

describe('acquireLock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('acquires lock', () => {
    acquireLock();
    expect(Mutex).toHaveBeenCalledTimes(0);
  });

  it('acquires new lock if parameter `create` is true', () => {
    acquireLock(true);
    expect(Mutex).toHaveBeenCalledTimes(1);
  });
});
