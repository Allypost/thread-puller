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

Router.use(cookieParser());
Router.use(helmet());

const siteUrl = URL.parse(process.env.THREADPULLER_DOMAIN_MAIN);
const cacheUrl = URL.parse(process.env.THREADPULLER_DOMAIN_CACHE);
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
    const cookie = cookies[ cookieName ] || {};

    if (req.hostname !== siteUrl.hostname)
        return next();

    const defaultSettings = {
        volume: 0,
        autoplay: false,
        loop: false,
    };

    const value = Object.assign({}, defaultSettings, cookie);

    res.cookie(cookieName, value, {
        domain: `.${siteUrl.hostname}`,
        maxAge: 1000 * 60 * 60 * 24 * 365,
    });

    return next();
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

const FOOTER = `<footer>Copyright &copy; ${new Date().getFullYear()} Allypost | All content is courtesy of <a href="https://www.4chan.org" target="_blank" rel="noopener noreferrer">4chan</a> | <a href="https://paypal.me/allypost" target="_blank" rel="noopener noreferrer">Donate to keep it going</a></footer>`;
const META = `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><meta name="theme-color" content="#1E1E1E"><meta name="application-name" content="ThreadPuller - View 4chan thread images and videos"><meta name="msapplication-TileColor" content="#1E1E1E">`;
// noinspection JSUnresolvedVariable
const GoogleAnalytics = `<script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.THREADPULLER_GA_KEY}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.THREADPULLER_GA_KEY}');</script>`;

ResourceWatcher.watch(styles);
ResourceWatcher.watch(scripts);

Router.use('/', express.static(path.join(__dirname, 'public')));

Router.get('/', async (req, res) => {
    res.type('html');
    res.write(META);

    res.write('<title>ThreadPuller</title>');

    ResourceWatcher.getAssets(styles, 'global', 'index').forEach(({ link: style, tag: v }) => res.write(`<link rel="stylesheet" href="${style}?v=${v}">`));

    res.write(`<div id="wrap">`);
    res.write(`<h1 class="no-select">ThreadPuller - Pull 4chan image threads</h1>`);

    (await Boards.get())
        .forEach(({ title: title, board: board, link: link, description: description, nsfw: nsfw }) => res.write(`
            <article class="board" ${nsfw ? 'data-nsfw="1"' : ''}>
                <header>
                    <h1 class="title"><a href="${link}">/${board}/ - ${title}</a></h1>
                </header>
                <section class="description">${description}</section>
            </article>`.trim().replace(/\s+/g, ' ').replace(/> </, '><')));

    res.write(`</div>${FOOTER}`);
    res.write(GoogleAnalytics);
    res.end();
});

Router.get('/:board/', async (req, res) => {
    const board = htmlentities(req.params.board);
    const rawBoardPosts = await Threads.get(board);

    res.type('html');
    res.write(META);

    ResourceWatcher.getAssets(styles, 'global', 'board').forEach(({ link: src, tag: v }) => res.write(`<link rel="stylesheet" href="${src}?v=${v}">`));
    ResourceWatcher.getAssets(scripts, 'cookie', 'linkify', 'board').forEach(({ link: src, tag: v }) => res.write(`<script src="${src}?v=${v}"></script>`));

    if (!rawBoardPosts) {
        res.write(`<title>/404/ - Board Not Found</title>`);
        res.write(`<div id="wrap">`);
        res.write(`<h1><a href="/">Back</a> | <a href="https://boards.4chan.org/${board}/" target="_blank" rel="noopener noreferrer">Go to board</a></h1>`);
        res.write(`<h1>Can't find the board \`${board}\`</h1>`);
        res.write(`</div>${FOOTER}`);
        return res.end();
    }

    res.write(`<title>/${board}/ - ThreadPuller</title>`);

    res.write(`<div id="wrap">`);
    res.write(`<h1 class="no-select"><a href="/">Back</a> | <a href="https://boards.4chan.org/${board}/" target="_blank" rel="noopener noreferrer">Go to board</a></h1>`);
    res.write(`<h1 class="no-select">Board: /${board}/</h1>`);

    rawBoardPosts.forEach(
        post =>
            res.write(
                `<article class="board">
                     <header ${!post.body.title ? 'data-missing-title="1"' : ''}>
                        <h1 class="title"><a href="${`/${board}/thread/${post.thread}`}">${post.body.title || '<i>No title</i>'}</a></h1>
                     </header>
                     <section class="content ${!post.body.content ? 'no-content' : ''}">${
                    post.file
                    ? `<section class="post-image-container" data-is-video="${post.file.meta.isVideo}">
                           <img data-src-full="${post.file.meta.fullSrc}" data-src-thumb="${post.file.meta.thumbSrc}" src="${post.file.meta.thumbSrc}" alt="${post.file.name}">
                       </section>`
                    : ''
                    }<section class="description">${post.body.content}</section>
                     </section>
                     <footer class="meta">${post.meta.images} images<!-- | <a href="https://boards.4chan.org/${post.board}/thread/${post.thread}/" target="_blank" rel="noopener noreferrer">Direct link</a>--></footer>
                 </article>`.trim().replace(/\s+/g, ' ').replace(/> </, '><'),
            ),
    );
    res.write(`</div>${FOOTER}`);

    res.write('<script>(function() { Board.init() })()</script>');

    res.write(GoogleAnalytics);
    res.end();
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
    const posts = fuse.search(query);

    res.type('html');
    res.write(META);

    ResourceWatcher.getAssets(styles, 'global', 'board').forEach(({ link: src, tag: v }) => res.write(`<link rel="stylesheet" href="${src}?v=${v}">`));
    ResourceWatcher.getAssets(scripts, 'cookie', 'linkify', 'board').forEach(({ link: src, tag: v }) => res.write(`<script src="${src}?v=${v}"></script>`));

    if (!posts.length) {
        res.write(`<title>/${board}/${htmlentities(query)}/ - No laughs found</title>`);
        res.write(`<div id="wrap">`);
        res.write(`<h1><a href="/${board}/">Back</a></h1>`);
        res.write(`<h1 class="no-select">Can't find any \`${htmlentities(query)}\` posts in /${board}/</h1>`);
        res.write(`</div>${FOOTER}`);
        return res.end();
    }

    res.write(`<title>/${board}/${htmlentities(query)}/ - ThreadPuller</title>`);
    res.write(`<div id="wrap">`);
    res.write(`<h1 class="no-select"><a href="/${board}/">Back</a> | <a href="https://boards.4chan.org/${board}/" target="_blank" rel="noopener noreferrer">Go to board</a></h1>`);
    res.write(`<h1 class="no-select">Board Search: /${board}/${htmlentities(query)}/</h1>`);

    posts.forEach(
        post =>
            res.write(
                `<article class="board">
                     <header ${!post.body.title ? 'data-missing-title="1"' : ''}>
                        <h1 class="title"><a href="${`/${post.board}/thread/${post.thread}`}">${post.body.title || '<i>No title</i>'}</a></h1>
                     </header>
                     <section class="content ${!post.body.content ? 'no-content' : ''}">${
                    post.file
                    ? `<section class="post-image-container" data-is-video="${post.file.meta.isVideo}">
                           <img data-src-full="${post.file.meta.fullSrc}" data-src-thumb="${post.file.meta.thumbSrc}" src="${post.file.meta.thumbSrc}" alt="${post.file.name}">
                       </section>`
                    : ''
                    }<section class="description">${post.body.content}</section>
                     </section>
                 </article>`.trim().replace(/\s+/g, ' ').replace(/> </, '><'),
            ),
    );
    res.write(`</div>${FOOTER}`);

    res.write('<script>(function() { Board.init() })()</script>');

    res.write(GoogleAnalytics);
    res.end();
});

Router.get('/:board/thread/:thread', async (req, res) => {
    const p = Object.entries(req.params)
                    .map(([ key, value ]) => [ key, htmlentities(value) ])
                    .reduce((obj, [ k, v ]) => Object.assign(obj, { [ k ]: v }), {});

    const posts = await Posts.get(p.board, p.thread);

    res.type('html');
    res.write(META);
    ResourceWatcher.getAssets(styles, 'global', 'thread').forEach(({ link: style, tag: v }) => res.write(`<link rel="stylesheet" href="${style}?v=${v}">`));
    ResourceWatcher.getAssets(scripts, 'cookie', 'mobile-detect', 'thread').forEach(({ link: src, tag: v }) => res.write(`<script src="${src}?v=${v}"></script>`));

    if (!posts) {
        res.write(`<title>/404/ - Thread Not Found...</title>`);
        res.write(`<div id="wrap">`);
        res.write(`<h1 class="no-select"><a href="/${p.board}/">Back</a> | <a href="${Posts.constructor.threadUrl(p.board, p.thread)}" target="_blank" rel="noopener noreferrer">Go to thread</a></h1>`);
        res.write(`<h1 class="no-select">There are no posts here...<br>Please try again later</h1>`);
        res.write(`</div>${FOOTER}`);

        return res.end();
    }

    const firstPost = posts[ 0 ];

    res.write(`<title>/${firstPost.board}/ - ${firstPost.body.title || firstPost.body.content.substr(0, 150) || 'No title'}</title>`);
    res.write(`<div id="wrap">`);
    res.write(`<h1 class="no-select"><a href="/${p.board}/">Back</a> | <a href="${Posts.constructor.threadUrl(p.board, p.thread)}" target="_blank" rel="noopener noreferrer">Go to thread</a></h1>`);
    res.write(`<h1 class="no-select">Board: /${p.board}/</h1>`);
    res.write(`<h1 class="no-select">Thread: ${firstPost.body.title || firstPost.body.content.substr(0, 150) || 'No title'}</h1>`);

    posts.forEach(post => {
        if (post.file)
            res.write(PostResource.get(post, req.query, req.cookies));
    });

    res.write(`</div>${FOOTER}`);

    res.write('<script>(function() { Thread.init() })()</script>');

    res.write(GoogleAnalytics);
    res.end();
});

Router.get('/i/:board/:resource.:ext', (req, res) => {
    const p = req.params;

    /*const referrer = (req.headers || {})[ 'referer' ] || '';
     const parsedReferrer = URL.parse(referrer);

     if (
     !parsedReferrer
     || parsedReferrer[ 'host' ] !== siteUrl[ 'host' ]
     )
     return res.status(403).end();*/

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

app.use(Router);

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
