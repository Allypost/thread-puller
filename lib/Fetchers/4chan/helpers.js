import axios from 'axios';
import consola from 'consola';

/**
 * @param {Number} ms
 *
 * @returns {Promise<undefined>}
 */
const sleep =
  (ms) =>
    new Promise(
      (resolve) =>
        setTimeout(resolve, ms)
      ,
    )
;

/**
 * @param {String} url
 * @param {any} defaultValue
 * @returns {Promise<null|any>}
 */
export const get = async (url, defaultValue = {}) => {
  const retryAttempts = 5;
  const sleepMinMs = 150;
  const sleepMaxMs = 350;

  for (let attempt = 0; attempt < retryAttempts; attempt++) {
    try {
      const { data } = await axios.get(
        url,
        {
          'headers': {
            'Referer': 'https://4chan.org/',
            'User-Agent': 'ThreadPuller',
          },
          'responseType': 'json',
        },
      );

      return data;
    } catch (e) {
      consola.error(`(${ attempt + 1 }/${ retryAttempts }) 4chan fetch error`, url, e);

      const randTime = ((sleepMaxMs - sleepMinMs) * Math.random()) + sleepMinMs;

      await sleep(randTime);
    }
  }

  return defaultValue;
};
