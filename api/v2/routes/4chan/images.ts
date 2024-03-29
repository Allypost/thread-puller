import http from 'http';
import consola from 'consola';
import ffmpeg from 'fluent-ffmpeg';
import {
  Router,
} from '../../../helpers/route';

const router = new Router();

router.getRaw('/i/:board/:resource.:ext', (req, res) => {
  const {
    ext,
    resource,
    board,
  } = req.params;

  const options: http.RequestOptions = {
    host: 'i.4cdn.org',
    path: `/${ board }/${ resource }.${ ext }`,
    method: 'GET',
    headers: {
      'Referer': 'https://boards.4chan.org/',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'User-Agent': process.env.USER_AGENT,
      'Connection': 'keep-alive',
      'Accept-Encoding': 'gzip, deflate',
    },
  };

  http
    .request(options, (mediaResponse) => {
      res.set(mediaResponse.headers);
      res.status(mediaResponse.statusCode || 200);

      consola.log(mediaResponse);

      mediaResponse.pipe(res, { end: true });
    })
    .on('error', (e) => consola.error('image fetch error', e))
    .end();
});

router.getRaw('/thumb/:board/:resource.:ext.png', (req, res) => {
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

router.getRaw('/thumb/:board/:resource.:ext.jpg', (req, res) => {
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

export default router;
