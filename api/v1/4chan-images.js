import axios from 'axios';
import consola from 'consola';
import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import {
  HttpStatus,
} from '../../lib/Helpers/Http';

const app = express();
app.disable('x-powered-by');

app.get(
  '/i/:board/:resource.:ext',
  async ({
    params,
    headers,
  }, res) => {
    const {
      ext,
      resource,
      board,
    } = params;

    const options = {
      method: 'GET',
      responseType: 'stream',
      headers: {
        ...headers,
        'Referer': 'https://boards.4chan.org/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent': process.env.USER_AGENT,
        'Connection': 'close',
        'Accept-Encoding': 'gzip, deflate',
        'Host': 'i.4cdn.org',
        'Cookie': '',
      },
    };

    res.set('Connection', 'close');

    try {
      const response = await axios.get(
        `https://i.4cdn.org/${ board }/${ resource }.${ ext }`,
        options,
      );

      res.set(response.headers);
      res.status(response.status);

      if (304 === response.status) {
        return res.end();
      }

      await new Promise((resolve, reject) => {
        response.data.on('data', (data) => {
          res.write(data);
        });

        response.data.on('end', () => {
          resolve(null);
        });

        response.data.on('error', (err) => {
          reject(err);
        });
      });
    } catch (e) {
      if (304 === e?.response.status) {
        res.set(e?.response.headers);
        res.status(304);
      } else {
        consola.error('image fetch error', e);
        res.status(HttpStatus.Error.Server.InternalServerError);
      }
    } finally {
      res.end();
    }
  },
);

app.get('/thumb/:board/:resource.:ext.png', (req, res) => {
  const {
    board,
    resource,
    ext,
  } = req.params;

  res.type('png');

  ffmpeg()
    .input(`https://i.4cdn.org/${ board }/${ resource }.${ ext }`)
    .frames(1)
    .output(res, { end: false })
    .outputOptions('-f image2pipe')
    .outputOptions('-vcodec png')
    .on('error', (err) => {
      consola.error('thumb transcode png error', err);

      res.status(404).end();
    })
    .on('end', () => {
      res.end();
    })
    .run();
});

app.get('/thumb/:board/:resource.:ext.jpg', (req, res) => {
  const {
    board,
    resource,
    ext,
  } = req.params;

  res.type('jpg');

  ffmpeg()
    .input(`https://i.4cdn.org/${ board }/${ resource }.${ ext }`)
    .output(res, { end: false })
    .outputOptions('-f image2pipe')
    .outputOptions('-vframes 1')
    .outputOptions('-vcodec mjpeg')
    .on('error', (err) => {
      consola.error('thumb transcode jpg error', err);

      res.status(404).end();
    })
    .on('end', () => {
      res.end();
    })
    .run();
});

module.exports = {
  path: '/files/',
  handler: app,
};
