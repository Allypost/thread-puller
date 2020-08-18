import Boards from '../../../../lib/Fetchers/4chan/Boards';
import Posts from '../../../../lib/Fetchers/4chan/Posts';
import Threads from '../../../../lib/Fetchers/4chan/Threads';
import {
  Fuse,
} from '../../../../lib/Search/Fuse';
import {
  ApiError,
  HttpStatus,
  Router,
} from '../../../helpers/route';

const router = new Router();

router.get('/boards', async () => {
  return await Boards.get();
});

router.get('/board/:board', async ({ params }) => {
  const { board } = params;

  return await Boards.info(board);
});

router.get('/boards/:board/threads', async ({ params }) => {
  const { board } = params;

  return await Threads.get(board);
});

router.get('/boards/:board/thread/:thread', async ({ params }) => {
  const { board, thread } = params;

  return await Posts.get(board, thread);
});

router.post('/search/threads', async ({ body }) => {
  const searchKeys = [
    {
      name: 'body.title',
      weight: 0.50,
    },
    {
      name: 'body.content',
      weight: 0.40,
    },
    {
      name: 'file.name',
      weight: 0.10,
    },
  ];

  /**
   * @param {Boolean} allowNSFW
   * @returns {Object[]}
   */
  async function getBoards(allowNSFW = true) {
    const boards = await Boards.get();

    if (allowNSFW) {
      return boards;
    }

    return boards.filter(({ nsfw }) => !nsfw);
  }

  /**
   * @returns {Promise<{item: Object, score: Number}[]>}
   */
  async function searchOneBoard(board, query) {
    const threads = await Threads.get(board);

    return (
      Fuse(
        threads,
        searchKeys,
      )
        .search(query)
    );
  }

  /**
   * @returns {Promise<{item: Object, score: Number}[]>}
   */
  async function searchAllBoards(allowNsfw, query) {
    const boards = await getBoards(allowNsfw);

    /**
     * @type {{item: Object, score: Number}[]}
     */
    const threads =
      (
        await Promise.all(
          boards
            .map(async ({ board }) => await searchOneBoard(board, query))
          ,
        )
      )
        .flat()
    ;

    return (
      threads
        .sort(
          (a, b) =>
            a.score - b.score
          ,
        )
    );
  }

  const { query, nsfw: allowNsfw, board = '' } = body;

  if (!query || 3 >= query.length) {
    throw new ApiError(
      'Search term must be at least 3 characters long',
      HttpStatus.Names.Conflict,
    );
  }

  if (board) {
    return searchOneBoard(board, query);
  } else {
    return searchAllBoards(allowNsfw, query);
  }
});

router.post('/search/posts', async ({ body }) => {
  const searchKeys = [
    {
      name: 'body.title',
      weight: 0.50,
    },
    {
      name: 'body.content',
      weight: 0.40,
    },
    {
      name: 'file.name',
      weight: 0.10,
    },
  ];

  /**
   * @returns {Promise<{item: Object, score: Number}[]>}
   */
  async function searchOneThread(board, thread, query) {
    const threads = await Posts.get(board, thread);

    return (
      Fuse(
        threads,
        searchKeys,
      )
        .search(query)
    );
  }

  const { query, board } = body;

  if (!query || 3 >= query.length) {
    throw new ApiError(
      'Search term must be at least 3 characters long',
      HttpStatus.Names.Conflict,
    );
  }

  if (!board) {
    throw new ApiError(
      'The board must be set',
      HttpStatus.Names.Conflict,
    );
  }

  const threads = await Threads.get(board);

  /**
   * @type {{item: Object, score: Number}[]}
   */
  const posts =
    await Promise.all(
      threads
        .map(
          async ({ board, thread }) =>
            await searchOneThread(board, thread, query)
          ,
        )
      ,
    )
  ;

  return (
    posts
      .flat()
      .sort(
        (a, b) =>
          a.score - b.score
        ,
      )
  );
});

export default router.expose();
