import {
  Readable,
} from 'stream';
import axios from 'axios';
import type {
  AxiosRequestConfig,
} from 'axios';
import consola from 'consola';
import {
  HttpStatus,
} from '../../../../lib/Helpers/Http';
import {
  Router,
} from '../../../helpers/route';

const router = new Router();

router.getRaw(
  '/:board*',
  async ({
    params,
    headers,
  }, res) => {
    const resource = params.board + params[ 0 ];

    const options: AxiosRequestConfig = {
      url: `https://bunkerchan.xyz/${ resource }`,
      method: 'GET',
      responseType: 'stream',
      headers: {
        ...headers,
        'Referer': 'https://bunkerchan.xyz/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent': process.env.USER_AGENT,
        'Connection': 'close',
        'Accept-Encoding': 'gzip, deflate',
        'Host': 'bunkerchan.xyz',
        'Cookie': '',
      },
    };

    try {
      const response = await axios.get<Readable>(
        `https://bunkerchan.xyz/${ resource }`,
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

export default router;
