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
const session = require('express-session');
const bodyParser = require('body-parser');
const csrf = require('csurf')({ cookie: true });
const passport = require('passport');
const expressMessages = require('express-messages');
const requireLoggedIn = require('./lib/Helpers/middleware/logged-in')();

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

app.enable("trust proxy");
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

Router.use('/', express.static(path.join(__dirname, 'public')));

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

app.use(session(require('./config/session')(redis)));
app.use(require('connect-flash')());
app.use((req, res, next) => {
    res.locals.messages = expressMessages(req, res);
    next();
});

const siteUrl = URL.parse(process.env.THREADPULLER_DOMAIN_MAIN);
const cacheUrl = URL.parse(process.env.THREADPULLER_DOMAIN_CACHE);
const presenceUrl = URL.parse(process.env.THREADPULLER_DOMAIN_PRESENCE);
Router.use((req, res, next) => {
    const isImage = String(req.url).substr(0, 3) === '/i/' || String(req.url).substr(0, 7) === '/thumb/';

    if (siteUrl[ 'hostname' ] === cacheUrl[ 'hostname' ])
        return next();

    if (siteUrl[ 'hostname' ] === req.hostname) {
        if (isImage)
            return res.redirect(301, `${ process.env.THREADPULLER_DOMAIN_CACHE }${ req.url }`);

        return next();
    }

    if (cacheUrl[ 'hostname' ] === req.hostname) {
        if (!isImage)
            return res.redirect(301, `${ process.env.THREADPULLER_DOMAIN_MAIN }${ req.url }`);

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
        domain: `${ siteUrl.hostname }`,
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
        domain: `${ presenceUrl.hostname }`,
        maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return next();
});

Router.use((req, res, next) => {
    req.app.locals.req = req;

    next();
});


require('./config/passport')(passport);
Router.use(passport.initialize({ userProperty: 'user' }));
Router.use(passport.session({}));

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
    {
        name: 'login',
        link: `/css/login.min.css`,
    },
];
const scripts = [
    {
        name: 'global',
        link: `/js/App.min.js`,
    },
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
        name: 'stalker',
        link: `/js/Stalker.min.js`,
    },
    {
        name: 'presence',
        link: `/js/Presence.min.js`,
    },
    {
        name: 'login',
        link: `/js/Login.min.js`,
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
        name: 'socket-io',
        href: `https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js`,
    },
];

app.locals = {
    donateLink: process.env.THREADPULLER_DONATE_LINK,
    showAds: Boolean(+process.env.THREADPULLER_SHOW_ADS),
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
    sentryDSN: process.env.SENTRY_DSN_URL,
    ResourceWatcher,
};

ResourceWatcher.watch(styles);
ResourceWatcher.watch(scripts);

Router.get('/', async (req, res) => {
    const opts = {
        page: 'boards/show',
        styles: ResourceWatcher.getAssets(styles, 'global', 'index'),
        scripts: ResourceWatcher.getAssets(scripts, 'global'),
        settings: false,
        boards: await Boards.get(),
        meta: {
            title: 'ThreadPuller - Pull 4chan image threads',
            description: 'Strips down as much as possible so you can enjoy the pure imagery of the chan denizens.',
        },
    };

    res.render('base', opts);
});

Router.get('/stalk', requireLoggedIn, (req, res) => {
    const opts = {
        scripts: ResourceWatcher.getAssets(scripts, 'global', 'stalker', 'socket-io'),
    };

    res.render('stalk', opts);
});

Router.get('/login', csrf, (req, res) => {
    if (req.user)
        return res.redirect('/');

    const opts = {
        styles: ResourceWatcher.getAssets(styles, 'global', 'login'),
        scripts: ResourceWatcher.getAssets(scripts, 'global', 'login'),
        title: 'Login - ThreadPuller',
        page: 'auth/login',
        settings: false,
        csrf: {
            name: '_csrf',
            value: req.csrfToken(),
        },
    };

    res.render('base', opts);
});

Router.post('/login', csrf, (req, res, next) => {
    passport.authenticate('local', (_, user, { message = '' } = {}) => {
        const success = Boolean(user);
        const isXhr = req.xhr;

        if (isXhr)
            return res.json({ success, message });

        if (success)
            return req.logIn(user, () => {
                res.redirect(req.session.returnTo || '/');
                delete req.session.returnTo;
            });

        req.flash('error', message);
        res.redirect('/login');
    })(req, res, next);
});

Router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

Router.get('/:board/', async (req, res) => {
    const board = htmlentities(req.params.board);
    const threads = await Threads.get(board);

    const opts = {
        styles: ResourceWatcher.getAssets(styles, 'global', 'board'),
        scripts: ResourceWatcher.getAssets(scripts, 'global', 'linkify', 'board', 'settings'),
        threads,
        board,
    };

    if (!threads) {
        opts.title = '/404/ - Board Not Found';
        opts.page = 'board/not-found';
        opts.settings = false;
        opts.meta = {
            title: `/${ board }/ - 404 Board Not Found - ThreadPuller`,
            thumb: '/images/pepe-sad.png',
            description: `Can't find the board \`${ board.replace(/"/gi, '＂') }\`.`,
        };

        res.status(404);
        return res.render('base', opts);
    }

    const boardInfo = await Boards.info(board);
    opts.title = `/${ board }/ - ThreadPuller`;
    opts.page = 'board/show';
    opts.description = boardInfo.description;
    opts.meta = {
        title: `${ boardInfo.nsfw ? '[NSFW] ' : '' }/${ board }/ - ${ boardInfo.title } - ThreadPuller`,
        description: boardInfo.description.replace(/&quot;/gi, '＂'),
    };

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
        scripts: ResourceWatcher.getAssets(scripts, 'global', 'linkify', 'board', 'settings'),
        query,
        threads,
        board,
    };

    const safeQuery = query.replace(/"/gi, '＂');

    if (!threads.length) {
        opts.title = `/${ board }/${ query }/ - No laughs found`;
        opts.page = 'board/no-search-results';
        opts.settings = false;
        opts.meta = {
            title: `/${ board }/${ safeQuery }/ - ThreadPuller Search`,
            thumb: '/images/pepe-sad.png',
            description: `Can't find any \`${ safeQuery }\` posts in /${ board }/`,
        };

        res.status(404);
        return res.render('base', opts);
    }

    opts.title = `/${ board }/${ query }/ - ThreadPuller`;
    opts.page = 'board/search';
    opts.meta = {
        title: `/${ board }/${ safeQuery }/ - ThreadPuller Search`,
        description: `Search the /${ board }/ board for \`${ safeQuery }\` threads`,
    };

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
        scripts: ResourceWatcher.getAssets(scripts, 'global', 'thread', 'settings'),
        threadUrl: Posts.constructor.threadUrl(board, thread),
        board,
        thread,
        posts,
    };

    if (!posts) {
        opts.title = '/404/ - Thread Not Found';
        opts.page = 'thread/not-found';
        opts.meta = {
            title: `/${ board }/404 Thread Not Found/ - ThreadPuller`,
            thumb: '/images/pepe-sad.png',
            description: 'There are no posts here...\nPlease try again later.',
        };
        opts.settings = false;

        res.status(404);
        return res.render('base', opts);
    }

    const firstPost = posts[ 0 ];
    const title = PostResource.sanitizedTitle(firstPost);

    opts.page = 'thread/show';
    opts.title = `/${ firstPost.board }/ - ${ PostResource.sanitizedTitle(firstPost, 80).replace(/<br>/gi, ' ') }`;
    opts.postTitle = title;
    opts.meta = {
        title: `/${ board }/${ title.replace(/<br>/gi, ' ') }/ - ThreadPuller`,
        description: PostResource.sanitize(firstPost.body.content || firstPost.body.title, 200, true).replace(/\n/gi, '\n'),
    };
    opts.renderOpts = PostResource.getOpts(req.query, req.cookies);

    if (firstPost.file)
        opts.meta.thumb = firstPost.file.meta.thumbSrc;

    res.render('base', opts);
});

Router.get('/i/:board/:resource.:ext', (req, res) => {
    const p = req.params;

    const options = {
        'host': 'i.4cdn.org',
        'path': `/${ p.board }/${ p.resource }.${ p.ext }`,
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

            resp.pipe(res, { end: true });
        })
        .on('error', e => Raven.captureException(e))
        .end();
});

Router.get('/thumb/:board/:resource.:ext.png', (req, res) => {
    const { board, resource, ext } = req.params;

    res.type('png');

    ffmpeg()
        .input(`https://i.4cdn.org/${ board }/${ resource }.${ ext }`)
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

Router.get('/thumb/:board/:resource.:ext.jpg', (req, res) => {
    const { board, resource, ext } = req.params;

    res.type('jpg');

    ffmpeg()
        .input(`https://i.4cdn.org/${ board }/${ resource }.${ ext }`)
        .output(res, { end: false })
        .outputOptions('-f image2pipe')
        .outputOptions('-vframes 1')
        .outputOptions('-vcodec mjpeg')
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
