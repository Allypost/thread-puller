import PostInfo from '../../Formatters/4chan/PostInfo';
import ThreadsBase from '../base/Threads';
import {
  get,
} from './helpers';

export default class Threads extends ThreadsBase {
  static siteName = 'FourChan';

  static async _getLive({ board }) {
    const url = `https://a.4cdn.org/${ board }/catalog.json`;
    const threads = await get(url, null);

    if (!threads) {
      return [];
    }

    return (
      threads
        .flatMap(
          ({ threads }) =>
            threads
          ,
        )
        .map(
          (thread) =>
            PostInfo.parse(board, thread)
          ,
        )
    );
  }
}
