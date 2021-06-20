import PostInfo from '../../Formatters/BunkerChan/PostInfo';
import PostsBase from '../base/Posts';
import {
  get,
} from './helpers';

export default class Posts extends PostsBase {
  static siteName = 'BunkerChan';

  static async _getLive({ board, thread }) {
    const url = `https://bunkerchan.xyz/${ board }/res/${ thread }.json`;
    const { posts, ...post } = await get(url);

    if (!post.threadId) {
      return [];
    }

    posts.unshift(post);

    const parsedPosts =
      [ post, ...posts ].map(
        (p) =>
          PostInfo.parse(board, post.threadId, p)
        ,
      )
    ;

    return PostInfo.addMetas(parsedPosts);
  }
}
