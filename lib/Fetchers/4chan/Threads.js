import {
  get,
} from 'axios';
import consola from 'consola';
import {
  callStorage,
  publishEvent,
} from '../../../lib/Redis/redis';
import PostInfo from '../../Formatters/PostInfo';
import Boards from './Boards';

export default class Threads {

  static async get(board) {
    const cached = await this.getCached(board);

    if (
      cached
      && Boolean(cached.length)
    ) {
      return cached;
    }

    return this.refreshCached(board);
  }

  static async getLive(board) {
    const url = `https://a.4cdn.org/${ board }/catalog.json`;
    const options = {
      'headers': {
        'Referer': `https://boards.4chan.org/${ board }/`,
        'User-Agent': 'ThreadPuller',
      },
      'responseType': 'json',
    };

    const { data } = await get(url, options) || {};

    if (!data) {
      return [];
    }

    return (
      [].concat(
        ...data
          .map(
            ({ threads }) =>
              threads.map(
                (thread) => PostInfo.parse(board, thread),
              ),
          ),
      )
    );
  }

  static async getCached(board) {
    const cacheKey = this.cacheKey(board);

    const data = await callStorage('get', cacheKey);

    try {
      return JSON.parse(data);
    } catch (e) {
      if (data) {
        await callStorage('del', cacheKey);
      }

      consola.error('thread cache delete error', e);
    }

    return null;
  }

  static async setCached(board, threads) {
    const cacheKey = this.cacheKey(board);

    if (!threads) {
      return null;
    }

    if (threads.length) {
      await callStorage(
        'set',
        cacheKey,
        JSON.stringify(threads),
        'EX',
        String(process.env.THREADPULLER_API_CACHE_FOR),
      );
    }

    return threads;
  }

  static async refreshCached(board) {
    const data = await this.setCached(board, await this.getLive(board));
    const payload = JSON.stringify({ board, data });

    await publishEvent('page-data:update:threads', payload);

    return data;
  }

  static cacheKey(board) {
    return `boards:${ board }`;
  }

  static boardUrl(board) {
    return `${ Boards.baseUrl() }/${ board }`;
  }

}
