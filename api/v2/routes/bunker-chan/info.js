import Boards from '../../../../lib/Fetchers/BunkerChan/Boards';
import Posts from '../../../../lib/Fetchers/BunkerChan/Posts';
import Threads from '../../../../lib/Fetchers/BunkerChan/Threads';
import {
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
  const { board, thread } = params;

  return await Posts.get(board, thread);
});

export default router;
