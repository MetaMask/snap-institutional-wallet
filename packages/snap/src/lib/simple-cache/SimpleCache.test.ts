import { SimpleCache } from './SimpleCache';

const sleep = require('util').promisify(setTimeout);

describe('SimpleCache', () => {
  it('should cache the results of a function', async () => {
    const data = [1, 2, 3];

    const sampleFunction = jest.fn().mockImplementation(() => data);

    const cache = new SimpleCache();

    const result = await cache.tryCaching('test', 10, sampleFunction);

    expect(result).toEqual(data);

    expect(cache.cacheExists('test'));
    // Then go again

    const result2 = await cache.tryCaching('test', 10, sampleFunction);

    expect(result2).toEqual(data);

    expect(sampleFunction).toHaveBeenCalledTimes(1);
  });

  it('should re-fetch if the cache is older than the age specified', async () => {
    const array = [1, 2, 3];

    const sampleFunction = jest.fn().mockImplementation(() => array);

    const cache = new SimpleCache();

    const result = await cache.tryCaching('test', -1, sampleFunction);

    expect(result).toEqual(array);

    await sleep(2000); // sleep for two seconds

    // But then request max age of 1

    await cache.tryCaching('test', 1, sampleFunction);

    expect(sampleFunction).toHaveBeenCalledTimes(2);
  });

  it('should be able to delete caches', async () => {
    const array = [1, 2, 3];

    const sampleFunction = jest.fn().mockImplementation(() => array);

    const cache = new SimpleCache();

    await cache.tryCaching('test', -1, sampleFunction);

    expect(cache.cacheExists('test')).toBe(true);

    cache.deleteCache('test');

    expect(cache.cacheExists('test')).toBe(false);
  });

  it('should be able to set caches manually', async () => {
    const value = 'hello world';

    const cache = new SimpleCache();

    cache.setCache('test', value);

    expect(cache.getCache('test')).toEqual(value);
  });

  it('should allow you to manually check if a cache is still valid', async () => {
    const cache = new SimpleCache();

    cache.setCache('test', 'hello world');

    // wait for two seconds
    await sleep(2000);

    // then check if the cache is still valid with a TTL of one seconds

    const result = cache.cacheValid('test', 1);

    expect(result).toBe(false);
  });
});
