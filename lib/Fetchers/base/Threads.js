import Fetcher from '../base/Fetcher';

export default class Threads extends Fetcher {
  static cacheObjectType = 'threads';

  /**
   * @param {String} board
   * @returns {Promise<*>}
   */
  static async get(board) {
    return this._get({ board });
  }

  /**
   * @param {String} board
   * @returns {Promise<*>}
   */
  static async refreshCached(board) {
    return this._refreshCached({ board });
  }
}
