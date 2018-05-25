const express = require('express');
const helmet = require('helmet');
const path = require('path');
const http = require('http');
const Raven = require('raven');
const Entities = new (require('html-entities').AllHtmlEntities);
const cookieParser = require('cookie-parser');
const URL = require('url');
const UUID = require('uuid/v1');
const SimpleLogger = require('./lib/Logging/SimpleLogger');
const ResourceWatcher = new (require('./lib/Resources/ResourceWatcher'))(path.join(__dirname, 'public'));

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
];

const FOOTER = `<footer>Copyright &copy; ${new Date().getFullYear()} Allypost | All content is courtesy of <a href="https://www.4chan.org" target="_blank" rel="noopener noreferrer">4chan</a> | <a href="https://paypal.me/allypost" target="_blank" rel="noopener noreferrer">Donate to keep it going</a></footer>`;
// noinspection JSUnresolvedVariable
const GoogleAnalytics = `<script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.THREADPULLER_GA_KEY}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.THREADPULLER_GA_KEY}');</script>`;

ResourceWatcher.watch(styles);
ResourceWatcher.watch(scripts);

const vid = (post, opts) => {
    const url = post.file.meta.fullSrc;
    const autoplay = opts.autoplay ? ' autoplay muted="true"' : '';
    const loop = opts.loop ? ' loop' : '';
    const volume = opts.volume / 100;

    // noinspection JSUnusedGlobalSymbols
    return `<video controls ${autoplay + loop} onloadstart="this.volume=${volume}" onerror="console.log(this)"><source src="${url}"></video>`;
};
const img = (post) => {
    const mainURL = post.file.meta.fullSrc;
    const altUrl = post.file.meta.thumbSrc;

    const height = post.file.dimensions.main.height;
    const width = post.file.dimensions.main.width;

    const ratio = height && width ? height / width : 0;

    const load = ratio !== 0 ? `onloadstart="this.setAttribute('height', this.offsetWidth * ${ratio} + 'px');"` : '';

    //  onerror="if(this.src !== '${altUrl}') { this.src = '${altUrl}' }"
    return `<img src="${altUrl}" data-master-src="${mainURL}" ${load} onload="if(this.src !== this.dataset.masterSrc) { this.src = this.dataset.masterSrc }">`;
};
const a = (url, name, newTab) => {
    const newT = newTab ? `target="_blank" rel="noopener noreferrer"` : '';

    return `<a href="${url}" class="resource" ${newT}>${name}</a>`;
};
const title = (post) => `<title>/${post.board}/ - ${post.body.title || post.body.content.substr(0, 150) || 'No title'}</title>`;
const meta = () => `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><meta name="theme-color" content="#1E1E1E"><meta name="application-name" content="ThreadPuller - View 4chan thread images and videos"><meta name="msapplication-TileColor" content="#1E1E1E">`;
const header = (thread, num) => `<h1 class="no-select"><a href="/${thread}/">Back</a> | <a href="${getThreadUrl(thread, num)}" target="_blank" rel="noopener noreferrer">Go to thread</a></h1>`;

const getOpts = (params, cookies) => {
    const cookieSettingsKeys = [ 'autoplay', 'volume', 'loop' ];
    const cookieSettings = {};

    try {
        const rawSettings = cookies[ 'thread_puller_settings' ];

        Object.assign(cookieSettings, JSON.parse(rawSettings));
    } catch (e) {
    }

    // Override unset url params from settings
    cookieSettingsKeys.forEach(setting => {
        if (typeof cookieSettings[ setting ] === typeof undefined)
            return;

        params[ setting ] = typeof params[ setting ] === typeof undefined ? cookieSettings[ setting ] : params[ setting ];
    });

    const autoplay = !!params.autoplay;
    const loop = autoplay || typeof params.loop !== typeof undefined
                 && params.loop !== 'false'
                 && params.loop !== 'no'
                 && +params.loop !== 0;
    const volume = typeof params.volume !== typeof undefined
                   ? +params.volume
                   : 50;

    return { autoplay, loop, volume };
};

const resource = (post, params, cookies) => {
    const opts = getOpts(params, cookies);
    const postUrl = getPostUrl(post.board, post.thread, post.id);
    const res = post.file.meta.isVideo
                ? vid
                : img;

    return a(postUrl, res(post, opts), true);
};

const getThreadUrl = (board, thread) => `https://boards.4chan.org/${board}/thread/${thread}`;
const getPostUrl = (board, thread, postNum) => `${getThreadUrl(board, thread)}#p${postNum}`;

Router.use('/', express.static(path.join(__dirname, 'public')));

Router.get('/', async (req, res) => {
    res.type('html');
    res.write(meta());

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
    res.write(meta());

    ResourceWatcher.getAssets(styles, 'global', 'board').forEach(({ link: src, tag: v }) => res.write(`<link rel="stylesheet" href="${src}?v=${v}">`));
    ResourceWatcher.getAssets(scripts, 'board', 'cookie', 'linkify').forEach(({ link: src, tag: v }) => res.write(`<script src="${src}?v=${v}"></script>`));

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

Router.get('/:board/ylyl/', async (req, res) => {
    const board = htmlentities(req.params.board);
    const posts = (await Threads.get(board) || [])
        .filter(
            post =>
                [ post.body.title || '', post.body.content || '' ]
                    .map(text => String(text).toLowerCase().includes('ylyl'))
                    .includes(true),
        );

    res.type('html');
    res.write(meta());

    ResourceWatcher.getAssets(styles, 'global', 'board').forEach(({ link: src, tag: v }) => res.write(`<link rel="stylesheet" href="${src}?v=${v}">`));
    ResourceWatcher.getAssets(scripts, 'board', 'cookie', 'linkify').forEach(({ link: src, tag: v }) => res.write(`<script src="${src}?v=${v}"></script>`));

    if (!posts.length) {
        res.write(`<title>/${board}/ylyl/ - No laughs found</title>`);
        res.write(`<div id="wrap">`);
        res.write(`<h1><a href="/">Back</a></h1>`);
        res.write(`<h1 class="no-select">Can't find any ylyl posts in /${board}/</h1>`);
        res.write(`</div>${FOOTER}`);
        return res.end();
    }

    res.write(`<title>/${board}/ylyl/ - ThreadPuller</title>`);
    res.write(`<div id="wrap">`);
    res.write(`<h1 class="no-select"><a href="/">Back</a> | <a href="https://boards.4chan.org/${board}/" target="_blank" rel="noopener noreferrer">Go to board</a></h1>`);
    res.write(`<h1 class="no-select">Meta Board: /${board}/ylyl/</h1>`);

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
    res.write(meta());
    ResourceWatcher.getAssets(styles, 'global', 'thread').forEach(({ link: style, tag: v }) => res.write(`<link rel="stylesheet" href="${style}?v=${v}">`));

    if (!posts) {
        res.write(title({ board: p.board, body: { title: 'Post not found...' } }));
        res.write(`<div id="wrap">`);
        res.write(header(p.board, p.thread));
        res.write(`<h1 class="no-select">There are no posts here...<br>Please try again later</h1>`);
        res.write(`</div>${FOOTER}`);

        return res.end();
    }

    res.write(title(posts[ 0 ]));
    res.write(`<div id="wrap">`);
    res.write(header(p.board, p.thread));
    res.write(`<h1 class="no-select">Board: /${p.board}/</h1>`);
    res.write(`<h1 class="no-select">Thread: ${posts[ 0 ].body.title || posts[ 0 ].body.content.substr(0, 150) || 'No title'}</h1>`);

    posts.forEach(post => {
        if (post.file)
            res.write(resource(post, req.query, req.cookies));
    });

    res.write(`</div>${FOOTER}`);
    res.write(GoogleAnalytics);
    res.end();
});

Router.get('/i/:board/:resource.:ext', (req, res) => {
    const p = req.params;

    const referrer = (req.headers || {})[ 'referer' ] || '';
    const parsedReferrer = URL.parse(referrer);

    const threadPullerDomain = URL.parse(process.env.THREADPULLER_DOMAIN_MAIN);

    if (!parsedReferrer || parsedReferrer[ 'host' ] !== threadPullerDomain[ 'host' ]) {
        if (redis) {
            const data = JSON.stringify({ referrer, headers: req.headers });
            redis.setAsync(`invalid-request:${UUID()}`, data, 'EX', 60 * 60 * 24);
            redis.publish('invalid-request', data);
        }

        res.status(403);
        return res.end();
    }

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
