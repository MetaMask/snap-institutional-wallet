/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type ISDKCache from './types';

export class SimpleCache {
  #cache: ISDKCache = {};

  public async tryCaching<CacheType>(
    key: string,
    maxCacheAgeSeconds: number,
    fn: () => Promise<CacheType>,
  ): Promise<CacheType> {
    if (maxCacheAgeSeconds >= 0) {
      if (this.cacheExists(key) && this.cacheValid(key, maxCacheAgeSeconds)) {
        return this.#cache[key]!.results;
      }
    }

    const results = await fn();

    this.#cache[key] = {
      results,
      timestamp: new Date().getTime(),
    };

    return results;
  }

  public setCache<CacheType>(key: string, value: CacheType): void {
    this.#cache[key] = {
      results: value,
      timestamp: new Date().getTime(),
    };
  }

  public getCache<CacheType>(key: string): CacheType {
    return this.#cache[key]!.results;
  }

  public cacheExists(key: string): boolean {
    return Boolean(
      Object.prototype.hasOwnProperty.call(this.#cache, key) &&
        this.#cache[key]!.results,
    );
  }

  public cacheValid(key: string, maxCacheAgeSeconds: number): boolean {
    const cache = this.#cache[key];
    const maxCacheAgeMs = maxCacheAgeSeconds * 1000;
    return cache
      ? new Date().getTime() - cache.timestamp < maxCacheAgeMs
      : false;
  }

  public deleteCache(key: string): void {
    if (this.cacheExists(key)) {
      delete this.#cache[key];
    }
  }
}
