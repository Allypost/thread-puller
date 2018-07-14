const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const Raven = require('raven');
const SimpleLogger = require('./lib/Logging/SimpleLogger');
const Entities = new (require('html-entities').AllHtmlEntities);
const Fuse = require('fuse.js');

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redisConf = {
    password: process.env.REDIS_PASSWORD,
    prefix: 'ThreadPuller:',
    db: process.env.REDIS_DB,
};

const htmlentities = Entities.encode;

const redis = new (require('./lib/DB/Redis'))(redisConf).redis;

const Boards = new (require('./lib/API/Boards'))(redis);
const Threads = new (require('./lib/API/Threads'))(redis);
const Posts = new (require('./lib/API/Posts'))(redis);
const API = new (require('./lib/API/API'))();

const app = express();
const Router = express.Router({});

Router.use(cookieParser());
Router.use(helmet());

Raven.config(process.env.SENTRY_DSN_URL).install();

Router.get('/boards', async (req, res) => {
    const boards = await Boards.get();

    return res.json(API.embedApiLinks(boards));
});

Router.get('/boards/:board', async (req, res) => {
    const board = htmlentities(req.params.board);
    const boardPosts = await Threads.get(board);

    res.json(API.embedApiLinks(boardPosts, board));
});

Router.get('/boards/:board/search/:query([a-zA-Z0-9_ %]{2,})', async (req, res) => {
    const board = htmlentities(req.params.board);
    const searchOptions = {
        caseSensitive: true,
        shouldSort: true,
        tokenize: false,
        threshold: 0.3,
        location: 0,
        distance: 20,
        maxPatternLength: 32,
        minMatchCharLength: 2,
        keys: [
            {
                name: 'body.title',
                weight: 0.7,
            },
            {
                name: 'body.content',
                weight: 0.3,
            },
        ],
    };
    const rawPosts = await Threads.get(board) || [];
    const fuse = new Fuse(rawPosts, searchOptions);
    const query = String(req.params.query || req.query.q || '');
    const posts = fuse.search(query);

    res.json(API.embedApiLinks(posts, board));
});

Router.get('/boards/:board/thread/:thread', async (req, res) => {
    const p = Object.entries(req.params)
                    .map(([ key, value ]) => [ key, htmlentities(value) ])
                    .reduce((obj, [ k, v ]) => Object.assign(obj, { [ k ]: v }), {});

    const posts = await Posts.get(p.board, p.thread);

    res.json(API.embedApiLinks(posts, p.board, p.thread));
});

app.use('/v1/', Router);

SimpleLogger.info('API starting...');

if (!redis)
    SimpleLogger.info('API starting without redis...');

http.createServer(app)
    .listen(process.env.API_PORT, () => {
        SimpleLogger.info('API started on port', process.env.API_PORT);
    })
    .on('error', err => {
        Raven.captureException(err);
    });
