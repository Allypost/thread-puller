import PostInfo from '../../Formatters/BunkerChan/PostInfo';
import type {
  Post,
} from '../../Types/BunkerChan/local';
import type {
  BunkerChanThreadCatalog,
} from '../../Types/BunkerChan/remote';
import PostsBase from '../base/Posts';
import {
  get,
} from './helpers';

export default class Posts extends PostsBase {
  static siteName = 'BunkerChan';

  public static async get(board: string, thread: string): Promise<Post[]> {
    return await this._get<Post>({
      board,
      thread,
    });
  }

  static async getLive({
    board,
    thread,
  }: { board: string; thread: string }): Promise<Post[]> {
    const url = `https://leftypol.org/${ board }/res/${ thread }.json`;
    const catalog = await get<BunkerChanThreadCatalog, null>(url);

    if (!catalog) {
      return [];
    }

    return PostInfo.parsePosts(catalog);
  }
}
