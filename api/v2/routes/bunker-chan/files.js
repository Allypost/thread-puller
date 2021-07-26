import axios from 'axios';
import consola from 'consola';
import {
  HttpStatus,
} from '../../../../lib/Helpers/Http';
import {
  Router,
} from '../../../helpers/route';

const router = new Router();

router.getRaw('/.media/:resource', async (req, res) => {
  const { resource } = req.params;

  const options = {
    url: `https://bunkerchan.xyz/.media/${ resource }`,
    method: 'GET',
    responseType: 'stream',
    headers: {
      'Referer': 'https://bunkerchan.xyz/',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'User-Agent': process.env.USER_AGENT,
      'Connection': 'keep-alive',
      'Accept-Encoding': 'gzip, deflate',
    },
  };

  try {
    const response = await axios(options);

    res.set(response.headers);
    res.status(response.status);

    response.data.pipe(res);
  } catch (e) {
    consola.error('image fetch error', e);
    res.status(HttpStatus.Error.Server.InternalServerError);
    res.end();
  }
});

export default router;
