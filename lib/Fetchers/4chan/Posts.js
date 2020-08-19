import PostInfo from '../../Formatters/4chan/PostInfo';
import PostsBase from '../base/Posts';
import {
  get,
} from './helpers';

export default class Posts extends PostsBase {
  static siteName = 'FourChan';

  static async _getLive({ board, thread }) {
    const url = `https://a.4cdn.org/${ board }/thread/${ thread }.json`;
    const { posts } = await get(url);

    if (!posts) {
      return [];
    }

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
