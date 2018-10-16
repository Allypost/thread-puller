const express = require('express');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const Raven = require('raven');
const Entities = new (require('html-entities').AllHtmlEntities);
const cookieParser = require('cookie-parser');
const URL = require('url');
const SimpleLogger = require('./lib/Logging/SimpleLogger');
const PostResource = require('./lib/Posts/PostResource');
const ResourceWatcher = new (require('./lib/Resources/ResourceWatcher'))(path.join(__dirname, 'public'));
const Fuse = require('fuse.js');
const ffmpeg = require('fluent-ffmpeg');
const uuid = require('uuid/v4');

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redisConf = {
    password: process.env.REDIS_PASSWORD,
    prefix: 'ThreadPuller:',
    db: process.env.REDIS_DB,
};

const redis = new (require('./lib/DB/Redis'))(redisConf).redis;

const Boards = new (require('./lib/API/Boards'))(redis);
const Threads = new (require('./lib/API/Threads'))(redis);
const Posts = new (require('./lib/API/Posts'))(redis);

const htmlentities = Entities.encode;

const app = express();
const Router = express.Router({});

app.set('view engine', 'ejs');
app.use((req, res, next) => {
    try {
        decodeURIComponent(req.path);
        next();
    } catch (e) {
        res.status(400);
        return res.send('Invalid parameter');
    }
});

Router.use(cookieParser());
Router.use(helmet());

const siteUrl = URL.parse(process.env.THREADPULLER_DOMAIN_MAIN);
const cacheUrl = URL.parse(process.env.THREADPULLER_DOMAIN_CACHE);
const presenceUrl = URL.parse(process.env.THREADPULLER_DOMAIN_PRESENCE);
Router.use((req, res, next) => {
    const isImage = String(req.url).substr(0, 3) === '/i/';

    if (siteUrl[ 'hostname' ] === cacheUrl[ 'hostname' ])
        return next();

    if (siteUrl[ 'hostname' ] === req.hostname) {
        if (isImage)
            return res.redirect(301, `${process.env.THREADPULLER_DOMAIN_CACHE}${req.url}`);

        return next();
    }

    if (cacheUrl[ 'hostname' ] === req.hostname) {
        if (!isImage)
            return res.redirect(301, `${process.env.THREADPULLER_DOMAIN_MAIN}${req.url}`);

        return next();
    }

    return res.status(403).send('Something went horribly wrong...');
});

Router.use((req, res, next) => {
    const cookieName = PostResource.settingsCookieName();
    const cookies = req.cookies;
    const cookie = cookies[ cookieName ];

    if (cookie)
        return next();

    if (req.hostname !== siteUrl.hostname)
        return next();

    const defaultSettings = {
        volume: 0,
        autoplay: false,
        loop: false,
    };

    const value = Object.assign({}, defaultSettings, cookie);

    res.cookie(cookieName, value, {
        domain: `${siteUrl.hostname}`,
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return next();
});

Router.use((req, res, next) => {
    const cookieName = 'threadpuller_presence';
    const cookies = req.cookies;
    const cookie = cookies[ cookieName ];

    if (cookie)
        return next();

    const value = uuid();

    res.cookie(cookieName, value, {
        domain: `${presenceUrl.hostname}`,
        maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return next();
});

Router.use((req, res, next) => {
    req.app.locals.req = req;

    next();
});

Raven.config(process.env.SENTRY_DSN_URL).install();

const styles = [
    {
        name: 'board',
        link: `/css/board.min.css`,
    },
    {
        name: 'global',
        link: `/css/global.min.css`,
    },
    {
        name: 'index',
        link: `/css/index.min.css`,
    },
    {
        name: 'thread',
        link: `/css/thread.min.css`,
    },
];
const scripts = [
    {
        name: 'board',
        link: `/js/Board.min.js`,
    },
    {
        name: 'thread',
        link: `/js/Thread.min.js`,
    },
    {
        name: 'settings',
        link: `/js/Settings.min.js`,
    },
    {
        name: 'download',
        link: `/js/Download.min.js`,
    },
    {
        name: 'cookie',
        href: `https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.2.0/js.cookie.min.js`,
    },
    {
        name: 'linkify',
        href: `https://cdnjs.cloudflare.com/ajax/libs/jQuery-linkify/2.1.6/linkify.min.js`,
    },
    {
        name: 'linkify',
        href: `https://cdnjs.cloudflare.com/ajax/libs/jQuery-linkify/2.1.6/linkify-html.min.js`,
    },
    {
        name: 'mobile-detect',
        href: `https://cdnjs.cloudflare.com/ajax/libs/mobile-detect/1.4.1/mobile-detect.min.js`,
    },
];

app.locals = {
    donateLink: process.env.THREADPULLER_DONATE_LINK,
    title: 'ThreadPuller',
    settings: true,
    $_styles: styles,
    $_scripts: scripts,
    ga: {
        key: process.env.THREADPULLER_GA_KEY,
        verification: process.env.THREADPULLER_GA_VERIFICATION,
    },
    rmWhitespace: true,
    presence: {
        domain: process.env.THREADPULLER_DOMAIN_PRESENCE,
        port: process.env.THREADPULLER_PRESENCE_PORT,
    },
    ResourceWatcher,
};

ResourceWatcher.watch(styles);
ResourceWatcher.watch(scripts);

Router.use('/', express.static(path.join(__dirname, 'public')));

Router.get('/', async (req, res) => {
    const opts = {
        page: 'boards/show',
        styles: ResourceWatcher.getAssets(styles, 'global', 'index'),
        settings: false,
        boards: await Boards.get(),
    };

    res.render('base', opts);
});

Router.get('/:board/', async (req, res) => {
    const board = htmlentities(req.params.board);
    const threads = await Threads.get(board);

    const opts = {
        styles: ResourceWatcher.getAssets(styles, 'global', 'board'),
        scripts: ResourceWatcher.getAssets(scripts, 'cookie', 'linkify', 'board', 'settings', 'download'),
        threads,
        board,
    };

    if (!threads) {
        opts.title = '/404/ - Board Not Found';
        opts.page = 'board/not-found';
        opts.settings = false;

        res.status(404);
        return res.render('base', opts);
    }

    opts.title = `/${board}/ - ThreadPuller`;
    opts.page = 'board/show';

    res.render('base', opts);
});

Router.get('/:board/:query([a-zA-Z0-9_ %]{2,})', async (req, res) => {
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
    const threads = fuse.search(query);

    const opts = {
        styles: ResourceWatcher.getAssets(styles, 'global', 'board'),
        scripts: ResourceWatcher.getAssets(scripts, 'cookie', 'linkify', 'board', 'settings', 'download'),
        query,
        threads,
        board,
    };

    if (!threads.length) {
        opts.title = `/${board}/${htmlentities(query)}/ - No laughs found`;
        opts.page = 'board/no-search-results';
        opts.settings = false;

        res.status(404);
        return res.render('base', opts);
    }

    opts.title = `/${board}/${query}/ - ThreadPuller`;
    opts.page = 'board/search';

    res.render('base', opts);
});

Router.get('/:board/thread/:thread', async (req, res) => {
    const p = Object.entries(req.params)
                    .map(([ key, value ]) => [ key, htmlentities(value) ])
                    .reduce((obj, [ k, v ]) => Object.assign(obj, { [ k ]: v }), {});

    const { board, thread } = p;
    const posts = await Posts.get(p.board, p.thread);

    const opts = {
        styles: ResourceWatcher.getAssets(styles, 'global', 'thread'),
        scripts: ResourceWatcher.getAssets(scripts, 'cookie', 'mobile-detect', 'thread', 'settings', 'download'),
        threadUrl: Posts.constructor.threadUrl(board, thread),
        board,
        thread,
        posts,
    };

    if (!posts) {
        opts.title = '/404/ - Thread Not Found';
        opts.page = 'thread/not-found';
        opts.settings = false;

        res.status(404);
        return res.render('base', opts);
    }

    const firstPost = posts[ 0 ];
    const title = PostResource.sanitizedTitle(firstPost);

    opts.page = 'thread/show';
    opts.title = `/${firstPost.board}/ - ${PostResource.sanitizedTitle(firstPost, 80, '')}`;
    opts.postTitle = title;
    opts.renderPost = PostResource.get;
    opts.renderParams = [ req.query, req.cookies ];

    res.render('base', opts);
});

Router.get('/i/:board/:resource.:ext', (req, res) => {
    const p = req.params;

    const options = {
        'host': 'i.4cdn.org',
        'path': `/${p.board}/${p.resource}.${p.ext}`,
        'method': 'GET',
        'headers': {
            'Referer': 'https://boards.4chan.org/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'User-Agent': process.env.USER_AGENT,
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate',
        },
    };

    http
        .request(options, resp => {
            res.set(resp.headers);
            res.status(resp.statusCode);

            resp
                .on('data', chunk => res.write(chunk))
                .on('end', () => res.end());
        })
        .on('error', e => Raven.captureException(e))
        .end();
});

Router.get('/thumb/:board/:resource.:ext.png', (req, res) => {
    const { board, resource, ext } = req.params;

    res.type('png');

    ffmpeg()
        .input(`https://i.4cdn.org/${board}/${resource}.${ext}`)
        .frames(1)
        .output(res, { end: false })
        .outputOptions('-f image2pipe')
        .outputOptions('-vcodec png')
        .on('error', (err) => {
            Raven.captureException(err);

            res.status(404).end();
        })
        .on('end', () => {
            res.end();
        })
        .run();
});

app.use(Router);

app.get('*', (req, res) => {
    res.status(404);
    res.render('base', { title: '/404/ - Page Not Found' });
});

SimpleLogger.info('Server starting...');

if (!redis)
    SimpleLogger.info('Starting without redis...');

http.createServer(app)
    .listen(process.env.PORT, () => {
        SimpleLogger.info('Server started on port', process.env.PORT);
    })
    .on('error', err => {
        Raven.captureException(err);
    });
