const http = require('http');

class Boards {

    constructor(redis) {
        this.redis = redis;

        this.options = {
            'host': 'a.4cdn.org',
            'path': `/boards.json`,
            'method': 'GET',
            'headers': {
                'Referer': `https://4chan.org/`,
                'User-Agent': 'ThreadPuller',
            },
        };
    }

    async get() {
        const cachedBoards = await this.getCached();

        if (
            cachedBoards
            && !!cachedBoards.length
        )
            return cachedBoards;

        return this.setCached(await this.getLive());
    }

    async getLive() {
        const resolver =
                  resolve =>
                      http
                          .request(this.options, res => {
                              if (res.statusCode !== 200)
                                  return resolve(null);

                              resolve(this.handleRequest(res));
                          })
                          .on('error', () => {
                              resolve(null);
                          })
                          .end();

        return new Promise(resolver);
    }

    async handleRequest(res) {
        const data = await this.fulfillRequest(res);

        // noinspection JSUnresolvedVariable
        if (!data || !data.boards)
            return null;

        // noinspection JSUnresolvedVariable
        return data.boards
                   .map(
                       board => ({
                           title: board.title,
                           board: board.board,
                           link: `/${board.board}/`,
                           description: board.meta_description,
                           nsfw: !board.ws_board,
                       }),
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

    async getCached() {
        const cacheKey = `boards`;
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

    setCached(boards) {
        const redis = this.redis;

        if (!boards)
            return null;

        if (redis && boards.length)
        // noinspection JSUnresolvedFunction
            redis.setAsync(`boards`, JSON.stringify(boards), 'EX', process.env.THREADPULLER_API_CACHE_FOR);

        return boards;
    }

    static baseUrl() {
        return `https://boards.4chan.org`;
    }

}

module.exports = Boards;

