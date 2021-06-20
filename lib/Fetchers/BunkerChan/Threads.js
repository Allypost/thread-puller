import ThreadInfo from '../../Formatters/BunkerChan/ThreadInfo';
import ThreadsBase from '../base/Threads';
import {
  get,
} from './helpers';

export default class Threads extends ThreadsBase {
  static siteName = 'BunkerChan';

  static async _getLive({ board }) {
    const url = `https://bunkerchan.xyz/${ board }/catalog.json`;
    const threads = await get(url, null);

    if (!threads) {
      return [];
    }

    const threadParser = ThreadInfo.parse.bind(null, board);

    return threads.map(threadParser);
  }
}
