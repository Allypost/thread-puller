import PostInfo from '../../Formatters/4chan/PostInfo';
import type {
  Post,
} from '../../Types/4chan/local';
import type {
  FourChanCatalog,
} from '../../Types/4chan/remote';
import ThreadsBase from '../base/Threads';
import {
  get,
} from './helpers';

export default class Threads extends ThreadsBase {
  protected static readonly siteName = 'FourChan';

  public static get(board: string): Promise<Post[]> {
    return this._get<Post>({
      board,
    });
  }

  public static async getLive(
    { board }: {
      board: string;
    },
  ): Promise<Post[]> {
    const url = `https://a.4cdn.org/${ board }/catalog.json`;
    const threads = await get<FourChanCatalog, null>(url, null);

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

  static async refreshCached(board: string): Promise<Post[]> {
    return await this._refreshCached<Post>({ board });
  }
}
