import axios from 'axios';
import express from 'express';
import bodyParser from 'body-parser';
import consola from 'consola';
import Boards from '../lib/Fetchers/4chan/Boards';
import Posts from '../lib/Fetchers/4chan/Posts';
import Threads from '../lib/Fetchers/4chan/Threads';
import PostInfo from '../lib/Formatters/PostInfo';
import { Fuse } from '../lib/Search/Fuse';

const app = express();

app.use(bodyParser.json());

function fetchData(cb) {
    return async (req, res) => {
        try {
            const data = await cb(req, res);

            res.json(data);
        } catch (err) {
            // eslint-disable-next-line no-console
            consola.error('\n🚨 There was an error while fetching:', err.config.url, err);

            res.status(404);
            res.json({
                error: 'Not found',
            });
        }
    };
}

function streamSearchData(generator) {
    return async ({ body }, res) => {
        const { query, nsfw: allowNSFW, board = '' } = body;

        if (!query || 3 > query.length) {
            return res.json([]);
        }

        const resultGenerator = generator(query, { board, allowNSFW });

        res.set('Content-Type', 'application/stream+json');
        res.set('Transfer-Encoding', 'chunked');

        try {
            let result = await resultGenerator.next();
            while (!result.done) {
                res.write(JSON.stringify(result.value));
                res.write('\n');

                result = await resultGenerator.next();
            }
        } catch (e) {
            consola.log(e);
        }

        res.send();
    };
}

/**
 * @param {String} query
 * @param {String} [board]
 * @param {Boolean} [allowNSFW]
 * @returns {AsyncIterableIterator<{total: Number, results: Number, threads: Object[]}>}
 */
async function* search4ChanBoardGenerator(query, { board = '' }) {
    let offset = 0;

    const threadList = new Map();
    const baseURL = new URL('https://find.4chan.org/api');
    const opts = new URLSearchParams({
        'q': query,
        'b': board,
        'o': offset,
    });
    baseURL.search = opts.toString();

    async function doFetch() {
        const response = await axios.get(baseURL.toString(), {
            responseType: 'application/json',
        });

        const { nhits: total, threads: threads = [] } = response.data;

        const hasUnique =
                  threads
                      .map((thread) => threadList.has(thread.thread))
                      .includes(false);

        if (hasUnique) {
            return { threads, total };
        } else {
            return null;
        }
    }

    let results = 0;
    while (true) {
        const data = await doFetch();

        if (!data) {
            break;
        }

        const { threads, total } = data;

        results += threads.reduce((acc, { posts }) => acc + posts.length, 0);

        yield {
            total,
            results,
            threads:
                threads
                    .filter((thread) => !threadList.has(thread.thread))
                    .map(({ board, posts: [ post ] }) => ({ item: PostInfo.parse(board, post), score: 1 })),
        };

        for (const thread of threads) {
            threadList.set(thread.thread, thread);
        }

        offset += 10;
        opts.set('o', String(offset));
        baseURL.search = opts.toString();
    }
}

/**
 * @param {String} query
 * @param {String} [board]
 * @param {Boolean} [allowNSFW]
 * @returns {AsyncIterableIterator<{total: Number, results: Number, threads: Object[]}>}
 */
async function* searchBoardGenerator(query, { board = '', allowNSFW = true }) {
    async function searchThreads(board) {
        const searchKeys = [
            {
                name: 'body.title',
                weight: 0.50,
            },
            {
                name: 'body.content',
                weight: 0.40,
            },
            {
                name: 'file.name',
                weight: 0.10,
            },
        ];

        const allThreads = await Threads.get(board);

        return (
            Fuse(allThreads, searchKeys)
                .search(query)
        );
    }

    /**
     * @param {Boolean} allowNSFW
     * @returns {Promise<Object[]>}
     */
    async function getBoards(allowNSFW = true) {
        const boards = await Boards.get();

        if (allowNSFW) {
            return boards;
        }

        return boards.filter(({ nsfw }) => !nsfw);
    }

    /**
     * @returns {Promise<{total: Number, results: Number, threads: Object[]}>}
     */
    async function one(board) {
        const threads = await searchThreads(board);

        return {
            total: 1,
            results: 1,
            threads,
        };
    }

    /**
     * @returns {Promise<{total: Number, results: Number, threads: Object[]}>}
     */
    async function* all() {
        const boards = await getBoards(allowNSFW);

        let results = 0;
        for (const { board } of boards) {
            const threads = await searchThreads(board);

            yield {
                total: boards.length,
                results: ++results,
                threads,
            };
        }
    }

    if (board) {
        yield one(board);
    } else {
        yield* all();
    }
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/boards', fetchData(async () => {
    return await Boards.get();
}));

app.get('/board/:board', fetchData(async ({ params }) => {
    const { board } = params;

    return await Boards.info(board);
}));

app.get('/boards/:board/threads', fetchData(async ({ params }) => {
    const { board } = params;

    return await Threads.get(board);
}));

app.get('/boards/:board/thread/:thread', fetchData(async ({ params }) => {
    const { board, thread } = params;

    return await Posts.get(board, thread);
}));

app.post('/search/remote', streamSearchData(search4ChanBoardGenerator));
app.post('/search/local', streamSearchData(searchBoardGenerator));

module.exports = {
    path: '/api/',
    handler: app,
};
