import consola from 'consola';
import {
  callStorage,
  publishEvent,
} from '../../../lib/Redis/redis';

export default class Fetcher {
  static siteName = 'base';

  static cacheObjectType = 'fetcher';

  static _getLive() {
    throw new Error('Method getLive not implemented');
  }

  /**
   * @param {Object} keys
   * @returns {Promise<*>}
   */
  static async _get(keys = {}) {
    const cached = await this._getCached(keys);

    if (
      cached
      && Boolean(cached.length)
    ) {
      return cached;
    }

    return this._refreshCached(keys);
  }

  /**
   * @param {Object} keys
   * @returns {Promise<*>}
   */
  static async _refreshCached(keys = {}) {
    const data = await this._setCached({ ...keys, data: await this._getLive(keys) });
    const payload = JSON.stringify({ ...keys, data });

    await publishEvent(`page-data:update:${ this._cacheKey(keys) }`, payload);

    return data;
  }

  static async _getCached(keys = {}) {
    const cacheKey = this._cacheKey(keys);
    const data = await callStorage('get', cacheKey);

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

  static async _setCached(keysWithData = {}) {
    const { data, ...keys } = keysWithData || {};

    if (!data) {
      return null;
    }

    if (data.length) {
      const cacheKey = this._cacheKey(keys);

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

  /**
   * @param {Object} keys
   * @returns {String}
   */
  static _cacheKey(keys = {}) {
    const args = Object.entries(keys).flat();
    const base = [ this.siteName, this.cacheObjectType ];

    const key = [
      ...base,
      ...args,
    ];

    return `${ key.join(':') }`;
  }
}
