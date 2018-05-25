const http = require('http');
const PostInfo = require('../../Posts/PostInfo');
const Boards = require('../Boards');

class Threads {

    constructor(redis) {
        this.redis = redis;
    }

    async get(board) {
        const cached = await this.getCached(board);

        if (
            cached
            && !!cached.length
        )
            return cached;

        return this.setCached(board, await this.getLive(board));
    }

    async getLive(board) {
        const resolver =
                  resolve =>
                      http
                          .request(this.constructor.options(board), async res => {
                              if (res.statusCode !== 200)
                                  return resolve(null);

                              resolve(await this.handleRequest(res, board));
                          })
                          .on('error', () => {
                              resolve(null);
                          })
                          .end();

        return new Promise(resolver);
    }

    static options(board) {
        return {
            'host': 'a.4cdn.org',
            'path': `/${board}/catalog.json`,
            'method': 'GET',
            'headers': {
                'Referer': `https://boards.4chan.org/${board}/`,
                'User-Agent': 'ThreadPuller',
            },
        };
    }

    async handleRequest(res, board) {
        const data = await this.fulfillRequest(res);

        if (!data)
            return null;

        // noinspection JSUnresolvedVariable
        return [].concat(
            ...data.map(page => page.threads)
                   .map(threads => threads.filter(thread => thread.images))
                   .map(threads => threads.map(thread => PostInfo.parse(board, thread))),
        );
    }

    async fulfillRequest(res) {
        return new Promise(resolve => {
            let body = '';

            res.setEncoding('utf8')
               .on('data', (chunk) => body += chunk)
               .on('end', () => {
                   try {
                       resolve(JSON.parse(body));
                   } catch (e) {
                       resolve(null);
                   }
               });
        });
    }

    async getCached(board) {
        const cacheKey = this.constructor.cacheKey(board);
        const redis = this.redis;

        if (redis)
            try {
                // noinspection JSUnresolvedFunction
                return JSON.parse(await redis.getAsync(cacheKey));
            } catch (e) {
                info(`Cache corruption in \`${cacheKey}\`! Purging...`);

                // noinspection JSUnresolvedFunction
                redis.delAsync(cacheKey);
            }

        return await this.getLive();
    }

    setCached(board, threads) {
        const cacheKey = this.constructor.cacheKey(board);
        const redis = this.redis;

        if (!threads)
            return null;

        if (redis && threads.length)
        // noinspection JSUnresolvedFunction
            redis.setAsync(cacheKey, JSON.stringify(threads), 'EX', process.env.THREADPULLER_API_CACHE_FOR);

        return threads;
    }

    static cacheKey(board) {
        return `boards:${board}`;
    }

    static boardUrl(board) {
        return `${Boards.baseUrl()}/${board}`;
    }

}

module.exports = Threads;

