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
 * @param {String} name
 * @param {String} referer
 * @returns {function(...[*]=)}
 */
export const getter =
  (name, referer) =>
    /**
     * @param {String} url
     * @param {any} defaultValue
     * @returns {Promise<any|null>}
     */
    async (url, defaultValue = {}) => {
      const retryAttempts = 5;
      const sleepMinMs = 150;
      const sleepMaxMs = 350;

      for (let attempt = 0; attempt < retryAttempts; attempt++) {
        try {
          const config = {
            'headers': {
              'Referer': referer,
              'User-Agent': 'ThreadPuller crawler',
            },
            'responseType': 'json',
          };
          const getData = ({ data }) => data;

          return await axios.get(url, config).then(getData);
        } catch (e) {
          consola.log(Object.fromEntries(Object.entries(e)));
          consola.error(`(${ attempt + 1 }/${ retryAttempts }) ${ name } fetch error`, url, e);

          const randTime = ((sleepMaxMs - sleepMinMs) * Math.random()) + sleepMinMs;

          await sleep(randTime);
        }
      }

      return defaultValue;
    }
;
