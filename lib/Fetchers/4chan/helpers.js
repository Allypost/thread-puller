import {
  getter,
} from '../base/helpers';

/**
 * @param {String} url
 * @param {any} defaultValue
 * @returns {Promise<null|any>}
 */
export const get = getter('4chan', 'https://4chan.org/');
