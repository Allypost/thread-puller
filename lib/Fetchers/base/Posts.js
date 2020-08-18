import Fetcher from '../base/Fetcher';

export default class Posts extends Fetcher {
  static cacheObjectType = 'posts';

  /**
   * @param {String} board
   * @param {String} thread
   * @returns {Promise<*>}
   */
  static async get(board, thread) {
    return this._get({ board, thread });
  }

  /**
   * @param {String} board
   * @param {String} thread
   * @returns {Promise<*>}
   */
  static async refreshCached(board, thread) {
    return this._refreshCached({ board, thread });
  }
}
