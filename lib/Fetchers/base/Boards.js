import Fetcher from '../base/Fetcher';

export default class Boards extends Fetcher {
  static cacheObjectType = 'boards';

  /**
   * @param {String} board
   * @returns {Promise<*>}
   */
  static async info(board) {
    const boards = await this.get();

    return boards.find((b) => b.board === board);
  }

  /**
   * @returns {Promise<*>}
   */
  static async get() {
    return await this._get();
  }

  /**
   * @returns {Promise<*>}
   */
  static async refreshCached() {
    return await this._refreshCached();
  }
}
