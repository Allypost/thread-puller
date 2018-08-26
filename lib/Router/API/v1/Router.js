const express = require('express');
const Fuse = require('fuse.js');
const Entities = new (require('html-entities').AllHtmlEntities);
const helmet = require('helmet');
const cookieParser = require('cookie-parser');


const htmlentities = Entities.encode;

function Router(redis) {
    const API = new (require('./API'))(`${process.env.THREADPULLER_DOMAIN_API}/v1`, 'v1');

    const Boards = new (require('../../../API/Boards'))(redis);
    const Threads = new (require('../../../API/Threads'))(redis);
    const Posts = new (require('../../../API/Posts'))(redis);

    const Router = express.Router({});

    Router.use(cookieParser());
    Router.use(helmet());
    Router.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');

        next();
    });

    Router.get('/', (req, res) => {
        return res.json(API.getApiLinks('%s', '%s'));
    });

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

    return Router;
}

module.exports = Router;
