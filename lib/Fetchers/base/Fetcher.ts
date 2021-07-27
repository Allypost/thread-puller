import consola from 'consola';
import type {
  Promisable,
} from 'type-fest';
import {
  callStorage,
  publishEvent,
} from '../../../lib/Redis/redis';

type Keys = Record<string, unknown>;

type KeysWithData<T> = { data?: T[] } & Keys;

export default abstract class Fetcher {
  protected static readonly siteName: string = 'base';

  protected static readonly cacheObjectType: string = 'fetcher';

  protected static getLive(_keys: Keys): Promisable<unknown> {
    throw new Error('Method getLive not implemented');
  }

  protected static async _refreshCached<T>(keys: Keys = {}): Promise<T[]> {
    const data = await this.setCached<T>({
      ...keys,
      data: await this.getLive(keys) as T[] || undefined,
    }) || [];

    const payload = JSON.stringify({
      ...keys,
      data,
    });

    await publishEvent(`page-data:update:${ this.cacheKey(keys) }`, payload);

    return data;
  }

  protected static async _get<T>(keys: Keys = {}): Promise<T[]> {
    const cached = await this.getCached<T>(keys);

    if (
      cached
      && 0 < cached.length
    ) {
      return cached;
    }

    return this._refreshCached<T>(keys);
  }

  private static async getCached<T>(keys: Keys = {}): Promise<T[] | null> {
    const cacheKey = this.cacheKey(keys);
    const data = await callStorage('get', cacheKey);

    if (null === data) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (e) {
      consola.error('cache parse error', e);
    }

    if (data) {
      await callStorage('del', cacheKey);
    }

    return null;
  }

  private static async setCached<T>(keysWithData: KeysWithData<T>): Promise<T[] | null> {
    const {
      data,
      ...keys
    } = keysWithData;

    if (!data) {
      return null;
    }

    if (0 < data.length) {
      const cacheKey = this.cacheKey(keys);

      await callStorage(
        'set',
        cacheKey,
        JSON.stringify(data),
        'EX',
        String(process.env.THREADPULLER_API_CACHE_FOR),
      );
    }

    return data;
  }

  private static cacheKey(keys: Keys): string {
    const args = Object.entries(keys).flat();
    const base = [ this.siteName, this.cacheObjectType ];

    const key = [
      ...base,
      ...args,
    ];

    return `${ key.join(':') }`;
  }
}
