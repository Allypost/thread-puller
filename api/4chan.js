import express from 'express';
import consola from 'consola';
import Boards from '../lib/Fetchers/4chan/Boards';
import Posts from '../lib/Fetchers/4chan/Posts';
import Threads from '../lib/Fetchers/4chan/Threads';

const app = express();

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

module.exports = {
    path: '/api/',
    handler: app,
};
