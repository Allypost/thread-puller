const express = require('express');
const helmet = require('helmet');
const request = require('request');
const path = require('path');
const http = require('http');
const URL = require('url');
const Raven = require('raven');

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const app = express();
const Router = express.Router();

Router.use(helmet());

Raven.config(process.env.SENTRY_DSN_URL).install();

const style = `<style>video, img { width: 24.3vw; padding: .15vw ; } body { margin: 0; }</style>`;

const getPosts = (url, cb) => {
    try {
        return request(
            {
                headers: {
                    'User-Agent': process.env.USER_AGENT,
                    'Referer': url,
                },
                uri: url,
                method: 'GET',
            },
            (err, resp, body) => {
                if (err)
                    return cb([]);

                try {
                    const data = JSON.parse(body);

                    cb(data.posts);
                } catch (err) {
                    Raven.captureException(err);

                    cb([ { 'sub': 'An error occured...' } ]);
                }
            },
        );
    } catch (err) {
        Raven.captureException(err);

        cb([ { 'sub': 'An error occured...' } ]);
    }

    return new Promise(new Function);
};

const localURL = (url) => {
    const urlParts = URL.parse(url);
    const origPath = urlParts.pathname;

    return `https://thrdpllr.tk/i${origPath}`;
};
const thumbURL = (url) => url.substr(0, url.lastIndexOf('.')) + 's.jpg';

const vid = (url, opts) => {
    const autoplay = opts.autoplay ? ' autoplay muted="true"' : '';
    const loop = opts.loop ? ' loop' : '';

    return `<video controls ${autoplay + loop} onloadstart="this.volume=0.5" onerror="console.log(this)"><source src="${url}"></video>`;
};
const img = (url) => {
    const mainURL = localURL(url);
    const altUrl = thumbURL(url);

    return `<img src="${mainURL}" onerror="if(this.src !== '${altUrl}') { this.src = '${altUrl}' }">`;
};
const a = (url, name, newTab) => {
    const newT = newTab ? `target="_blank"` : '';

    return `<a href="${url}" ${newT}>${name}</a>`;
};
const title = (post) => {
    const title = post[ 'sub' ] || post[ 'com' ] || 'No title';

    return `<title>${title}</title>`;
};
const header = (thread, num) => `<h1 style="text-align: center;">${a(getThreadUrl(thread, num), 'Go to thread', true)}</h1>`;

const resource = (post, params) => {
    const fileUrl = getFileUrl(post.thread, post.tim, post.ext);
    const postUrl = getPostUrl(post.thread, post.resto, post.no);

    // noinspection PointlessBooleanExpressionJS
    const autoplay = !!params.autoplay;
    const loop = typeof params.loop !== typeof undefined
                 && params.loop !== 'false'
                 && params.loop !== 'no'
                 && +params.loop !== 0;

    const opts = { autoplay, loop };

    let res = '';
    switch (post.ext.substr(1)) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            res = img(fileUrl);
            break;
        default:
            res = vid(fileUrl, opts);
            break;
    }

    return a(postUrl, res, true);
};

const getUrl = (thread) => `https://i.4cdn.org/${thread}/`;
const getApiUrl = (thread, num) => `https://a.4cdn.org/${thread}/thread/${num}.json`;
const getThreadUrl = (thread, num) => `https://boards.4chan.org/${thread}/thread/${num}`;
const getFileUrl = (thread, resourceID, extension) => getUrl(thread) + resourceID + extension;
const getPostUrl = (thread, num, postNum) => `${getThreadUrl(thread, num)}#p${postNum}`;

Router.use('/static', express.static(path.join(__dirname, 'public')));

Router.get('/:thread/thread/:num', (req, res) => {
    res.type('html');

    const p = req.params;
    const url = getApiUrl(p.thread, p.num);

    res.write(header(p.thread, p.num));

    getPosts(url, posts => {
        res.write(title(posts[ 0 ]));

        posts.forEach(post => {
            if (!post.tim)
                return;

            post.thread = p.thread;

            res.write(resource(post, req.query));
        });

        res.write(style);
        res.send();
    });
});

Router.get('/i/:thread/:id.:ext', (req, res) => {
    const p = req.params;

    const options = {
        'host': 'i.4cdn.org',
        'path': `/${p.thread}/${p.id}.${p.ext}`,
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
                .on('end', () => res.send());
        })
        .on('error', e => Raven.captureException(e))
        .end();
});

app.use(Router);

const dater = () => (new Date).toISOString();
const info = (...arguments) => console.log.apply(this, [ dater(), '|', ...arguments ]);

info('Server starting...');
http.createServer(app)
    .listen(process.env.PORT, () => {
        info('Server started on port', process.env.PORT);
    })
    .on('error', err => {
        Raven.captureException(err);
    });
