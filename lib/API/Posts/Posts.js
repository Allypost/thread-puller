const http = require('http');
const SimpleLogger = require('../../Logging/SimpleLogger');
const PostInfo = require('../../Posts/PostInfo');

class Posts {
    constructor(redis) {
        this.redis = redis;
    }

    async get(board, thread) {
        const cached = await this.getCached(board, thread);

        if (
            cached
            && !!cached.length
        )
            return cached;

        return this.setCached(board, thread, await this.getLive(board, thread));
    }

    async getLive(board, thread) {
        const resolver =
                  resolve =>
                      http
                          .request(this.constructor.options(board, thread), async res => {
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

    static options(board, thread) {
        return {
            'host': 'a.4cdn.org',
            'path': `/${board}/thread/${thread}.json`,
            'method': 'GET',
            'headers': {
                'Referer': `https://boards.4chan.org/${board}/${thread}`,
                'User-Agent': 'ThreadPuller',
            },
        };
    }

    async handleRequest(res, board) {
        const data = await this.fulfillRequest(res);

        // noinspection JSUnresolvedVariable
        if (!data || !data.posts)
            return null;

        // noinspection JSUnresolvedVariable
        return data.posts.map(post => PostInfo.parse(board, post));
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

    async getCached(board, thread) {
        const cacheKey = this.constructor.cacheKey(board, thread);
        const redis = this.redis;

        if (redis)
            try {
                // noinspection JSUnresolvedFunction
                return JSON.parse(await redis.getAsync(cacheKey));
            } catch (e) {
                SimpleLogger.info(`Cache corruption in \`${cacheKey}\`! Purging...`);

                // noinspection JSUnresolvedFunction
                redis.delAsync(cacheKey);
            }

        return await this.getLive(board, thread);
    }

    setCached(board, thread, posts) {
        const cacheKey = this.constructor.cacheKey(board, thread);
        const redis = this.redis;

        if (!posts)
            return null;

        if (redis && posts.length)
        // noinspection JSUnresolvedFunction
            redis.setAsync(cacheKey, JSON.stringify(posts), 'EX', process.env.THREADPULLER_API_CACHE_FOR);

        return posts;
    }

    static cacheKey(board, thread) {
        return `boards:${board}:${thread}`;
    }
}

module.exports = Posts;
