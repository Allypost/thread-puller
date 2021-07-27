import type {
  Post,
} from '../../Types/4chan/local';
import type {
  FourChanPost,
} from '../../Types/4chan/remote';
import FileInfo from './FileInfo';

export default class PostInfo {
  public static parse(board: string, post: FourChanPost): Post {
    return {
      id: +post.no,
      board,
      thread: post.resto || post.no,
      posted: new Date(post.time * 1000),
      body: {
        title: post.sub || '',
        poster: post.name || '',
        content: (post.com || '').replace(/<wbr>/gi, ''),
      },
      meta: {
        replies: post.replies || 0,
        images: post.images || 0,
      },
      file: FileInfo.parse(post, board),
    };
  }

  public static addMetas(posts: Post[]): Post[] {
    if (!Array.isArray(posts)) {
      return posts;
    }

    const newPosts = posts.slice();
    const addMeta = this.addMeta.bind(this, posts);

    return newPosts.map(addMeta);
  }

  private static addMeta(posts: Post[], post: Post): Post {
    const newPost = Object.assign({}, post);

    Object.assign(newPost, this.addRepliesTo(posts, post));
    Object.assign(newPost, this.addMentionsTo(post));

    return newPost;
  }

  private static addRepliesTo(posts: Post[], post: Post): Post {
    post.meta.replies = this.getReplies(posts, post);

    return post;
  }

  private static getReplies(posts: Post[], post: Post): Post['id'][] {
    return (
      posts
        .filter((p) => String(p.body.content || '').includes(`#p${ post.id }`))
        .map((p) => p.id)
    );
  }

  private static addMentionsTo(post: Post): Post {
    post.meta.mentions = this.getMentions(post);

    return post;
  }

  private static getMentions(post: Post): Post['id'][] {
    const re = /#p([0-9]+)/g;
    const { body: { content } } = post;
    const matches = content.match(re) || [];

    return matches.map((m) => Number(m.substring(2)));
  }
}
