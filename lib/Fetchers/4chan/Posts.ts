import PostInfo from '../../Formatters/4chan/PostInfo';
import type {
  Post,
} from '../../Types/4chan/local';
import type {
  FourChanThread,
} from '../../Types/4chan/remote';
import PostsBase from '../base/Posts';
import {
  get,
} from './helpers';

export default class Posts extends PostsBase {
  static siteName = 'FourChan';

  public static async get(board: string, thread: string | number): Promise<Post[]> {
    return await this._get<Post>({
      board,
      thread,
    });
  }

  static async getLive(
    {
      board,
      thread,
    }: {
      board: string;
      thread: string;
    },
  ): Promise<Post[]> {
    const url = `https://a.4cdn.org/${ board }/thread/${ thread }.json`;
    const data = await get<FourChanThread, null>(url, null);

    if (!data) {
      return [];
    }

    const { posts } = data;

    const parsedPosts =
      posts.map(
        (post) =>
          PostInfo.parse(board, post)
        ,
      )
    ;

    return PostInfo.addMetas(parsedPosts);
  }
}
