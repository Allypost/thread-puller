import ThreadInfo from '../../Formatters/BunkerChan/ThreadInfo';
import type {
  Post,
} from '../../Types/BunkerChan/local';
import type {
  BunkerChanBoardCatalog,
} from '../../Types/BunkerChan/remote';
import ThreadsBase from '../base/Threads';
import {
  get,
} from './helpers';

export default class Threads extends ThreadsBase {
  static siteName = 'BunkerChan';

  public static async get(board: string): Promise<Post[]> {
    return await this._get<Post>({ board });
  }

  static async getLive(
    { board }: {
      board: string;
    },
  ): Promise<Post[]> {
    const url = `https://leftypol.org/${ board }/catalog.json`;
    const threads = await get<BunkerChanBoardCatalog, null>(url, null);

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
            ThreadInfo.parse(
              thread,
            )
          ,
        )
    );
  }

  static async refreshCached(board: string): Promise<Post[]> {
    return await this._refreshCached<Post>({ board });
  }
}
