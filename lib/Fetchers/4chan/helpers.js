import axios from 'axios';
import consola from 'consola';

/**
 * @param {String} url
 * @param {any} defaultValue
 * @returns {Promise<null|any>}
 */
export const get = async (url, defaultValue = {}) => {
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
    consola.error('4chan fetch error', url, e);

    return defaultValue;
  }
};
