const express = require('express');
const request = require('request');
const fs = require('fs');
const mkdirp = require('mkdirp');
const http = require('http');
const URL = require('url');
const Raven = require('raven');

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const app = express();

Raven.config(process.env.SENTRY_URL).install();

const style = `<style> video, img { width: 24.3vw; padding: .15vw ; } body { margin: 0; } </style>`;

const getPosts = (url, cb) => {
    try {
        return request(
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
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

const dlLoc = (dir, url) => {
    const name = url.split('/').pop();

    return dir + name;
};
const fileName = (url) => {
    const file = url.split('/').pop();
    const nameArr = file.split('.');

    return nameArr[ 0 ];
};
const dl = (dir, url, cb) => {
    let id = fileName(url);

    mkdirp(dir, (err) => {
        if (err)
            return;

        let loc = dlLoc(dir, url);

        if (fs.existsSync(loc))
            return id;

        let file = fs.createWriteStream(loc);

        try {
            http
                .get(url, (response) => {
                    response.pipe(file);
                    response.on('end', function () {
                        cb(id);
                    });
                })
                .on('error', (err) => {
                    Raven.captureException(err);
                    file.end();
                    fs.unlink(loc, (err) => {
                        if (err)
                            Raven.captureException(err);
                    });
                })
                .end();
        } catch (err) {
            Raven.captureException(err);
        }

        console.log('Create: ' + loc);
    });

    return id;
};

const localURL = (url) => {
    const urlParts = URL.parse(url);
    const origPath = urlParts.pathname;

    return `/i${origPath}`;
};
const thumbURL = (url) => {
    return url.substr(0, url.lastIndexOf('.')) + 's.jpg';
};

const vid = (url, opts) => {
    const autoplay = opts.autoplay ? ' autoplay muted=\'true\'' : '';
    const loop = opts.loop ? ' loop' : '';

    return `<video controls ${autoplay + loop} onloadstart="this.volume=0.5" onerror="console.log(this)"><source src="${url}"></video>`;
};
const img = (url, isLocal) => {
    const mainURL = isLocal ? url : localURL(url);
    const altUrl = thumbURL(url);

    const error = !isLocal
        ? `onerror="if(this.src !== '${altUrl}') { this.src = '${altUrl}' }"`
        : '';

    return `<img src="${mainURL}" ${error}>`;
};
const li = (item) => {
    return `<li>${item}</li>`;
};
const a = (url, name, newTab) => {
    let newT = newTab ? `target="_blank"` : '';
    return `<a href="${url}" ${newT}>${name}</a>`;
};
const title = (post) => {
    const title = post[ 'sub' ] || post[ 'com' ] || 'No title';

    return `<title>${title}</title>`;
};

const resource = (url, params, isLocal) => {
    const imgs = [ 'jpg', 'png', 'gif', 'jpeg' ];
    const ext = url.split('/').pop().split('.').pop();
    // noinspection EqualityComparisonWithCoercionJS
    params.loop = params.loop == +params.loop ? +params.loop : params.loop;

    // noinspection PointlessBooleanExpressionJS
    const autoplay = !!params.autoplay;
    const loop = typeof params.loop !== typeof undefined
                 && params.loop !== 'false'
                 && params.loop !== 'no'
                 && +params.loop !== 0;

    const opts = { autoplay, loop };

    const isImg = imgs.indexOf(ext) >= 0;
    const res = isImg ? img(url, isLocal) : vid(url, opts);

    return a(url, res, true);
};

const getUrl = (thread) => {
    return `https://i.4cdn.org/${thread}/`;
};
const getDlDir = (thread, num) => {
    return `dl/${thread}/${num}/`;
};
const getApiUrl = (thread, num) => {
    return `https://a.4cdn.org/${thread}/thread/${num}.json`;
};

const pad = (width, string, padding) => {
    while (width - string.length > 0)
        string += padding;

    return string;
};

app.get('/:thread/thread/:num', (req, res) => {
    res.type('html');

    const p = req.params;
    const url = getApiUrl(p.thread, p.num);

    getPosts(url, posts => {
        res.write(title(posts[ 0 ]));

        posts.forEach(post => {
            if (!post.tim)
                return;

            const base = getUrl(p.thread);
            const postUrl = base + post.tim + post.ext;
            const file = resource(postUrl, req.query);

            res.write(file);
        });

        res.write(style);
        res.send();
    });
});

app.get('/i/:thread/:id.:ext', (req, res) => {
    const p = req.params;

    const options = {
        'host': 'i.4cdn.org',
        'path': `/${p.thread}/${p.id}.${p.ext}`,
        'method': 'GET',
        'headers': {
            'Referer': 'https://boards.4chan.org/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate',
        },
    };

    const ireq = http.request(options, resp => {
        res.set(resp.headers);
        res.status(resp.statusCode);

        resp.on('data', chunk => {
            res.write(chunk);
        });

        resp.on('end', () => {
            res.send();
        });
    });

    ireq.on('error', e => {
        Raven.captureException(e);
    });

    ireq.end();
});

app.get('/ping', (req, res) => res.send('pong'));

const dater = () => (new Date).toISOString();
const info = (...arguments) => console.log.apply(null, [ dater(), '|', ...arguments ]);

info('Server starting...');
http.createServer(app)
    .listen(process.env.PORT, () => {
        info('Server started');
        info('  Port:', process.env.PORT);
    })
    .on('error', err => {
        Raven.captureException(err);
    });
