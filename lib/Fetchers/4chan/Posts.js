import { get } from 'axios';
import { callStorage } from '../../../lib/Redis/redis';
import PostInfo from '../../Formatters/PostInfo';
import Threads from './Threads';

export default class Posts {

    static async get(board, thread) {
        const cached = await this.getCached(board, thread);

        if (
            cached
            && !!cached.length
        ) {
            return cached;
        }

        return this.setCached(board, thread, await this.getLive(board, thread));
    }

    static async getLive(board, thread) {
        const url = `https://a.4cdn.org/${ board }/thread/${ thread }.json`;
        const options = {
            'headers': {
                'Referer': `https://boards.4chan.org/${ board }/`,
                'User-Agent': 'ThreadPuller',
            },
            'responseType': 'json',
        };

        const { data = {} } = await get(url, options) || {};
        const { posts } = data;

        if (!posts) {
            return [];
        }

        const parsedPosts = posts.map((post) => PostInfo.parse(board, post));

        return PostInfo.addMetas(parsedPosts);
    }

    static async getCached(board, thread) {
        const cacheKey = this.cacheKey(board, thread);

        const data = await callStorage('get', cacheKey);

        try {
            return JSON.parse(data);
        } catch (e) {
            await callStorage('del', cacheKey);
        }

        return null;
    }

    static async setCached(board, thread, posts) {
        const cacheKey = this.cacheKey(board, thread);

        if (!posts) {
            return null;
        }

        if (posts.length) {
            await callStorage(
                'set',
                cacheKey,
                JSON.stringify(posts),
                'EX',
                String(process.env.THREADPULLER_API_CACHE_FOR),
            );
        }

        return posts;
    }

    static cacheKey(board, thread) {
        return `boards:${ board }:${ thread }`;
    }

    static threadUrl(board, thread) {
        return `${ Threads.boardUrl(board) }/thread/${ thread }`;
    }
}
