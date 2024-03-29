import FuseClass from 'fuse.js';
import Boards from '../../../../lib/Fetchers/4chan/Boards';
import Posts from '../../../../lib/Fetchers/4chan/Posts';
import Threads from '../../../../lib/Fetchers/4chan/Threads';
import {
  HttpStatus,
} from '../../../../lib/Helpers/Http';
import {
  Fuse,
} from '../../../../lib/Search/Fuse';
import type {
  Board,
  Post,
} from '../../../../lib/Types/4chan/local';
import {
  ApiError,
  Router,
} from '../../../helpers/route';

const router = new Router();

router.get('/boards', async () => {
  return await Boards.get();
});

router.get('/boards/:board', async ({ params }) => {
  const { board } = params;

  return await Boards.info(board);
});

router.get('/boards/:board/threads', async ({ params }) => {
  const { board } = params;

  return await Threads.get(board);
});

router.get('/boards/:board/threads/:thread/posts', async ({ params }) => {
  const {
    board,
    thread,
  } = params;

  return await Posts.get(board, thread);
});

router.post('/search/threads', ({ body }) => {
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

  async function getBoards(allowNSFW = true): Promise<Board[]> {
    const boards = await Boards.get();

    if (allowNSFW) {
      return boards;
    }

    return boards.filter(({ nsfw }) => !nsfw);
  }

  async function searchOneBoard(board: string, query: string): Promise<FuseClass.FuseResult<Post>[]> {
    const threads = await Threads.get(board);

    return (
      Fuse(
        threads,
        searchKeys,
      )
        .search(query)
    );
  }

  async function searchAllBoards(allowNsfw: boolean, query: string) {
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
          ({ score: scoreA = 0 }, { score: scoreB = 0 }) =>
            scoreA - scoreB
          ,
        )
    );
  }

  const {
    query,
    nsfw: allowNsfw,
    board = '',
  } = body;

  if (!query || 3 > query.length) {
    throw new ApiError(
      'Search term must be at least 3 characters long',
      HttpStatus.Error.Client.Conflict,
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
  async function searchOneThread(board: string, thread: string | number, query: string) {
    const threads = await Posts.get(board, thread);

    return (
      Fuse(
        threads,
        searchKeys,
      )
        .search(query)
    );
  }

  const {
    query,
    board,
  } = body;

  if (!query || 3 >= query.length) {
    throw new ApiError(
      'Search term must be at least 3 characters long',
      HttpStatus.Error.Client.Conflict,
    );
  }

  if (!board) {
    throw new ApiError(
      'The board must be set',
      HttpStatus.Error.Client.Conflict,
    );
  }

  const threads = await Threads.get(board);

  const posts =
    await Promise.all(
      threads
        .map(
          async ({
            board,
            thread,
          }) =>
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
        ({ score: scoreA = 0 }, { score: scoreB = 0 }) =>
          scoreA - scoreB
        ,
      )
  );
});

export default router;
