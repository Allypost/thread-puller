import type {
  Board,
} from '../../Types/BunkerChan/local';
import type {
  BunkerChanBoard,
} from '../../Types/BunkerChan/remote';

export default class BoardInfo {
  public static parse(board: BunkerChanBoard): Board {
    return {
      title: board.name,
      board: board.code,
      link: `/${ board.code }/`,
      description: '',
      nsfw: !board.sfw,
    };
  }

  public static board(
    title: string,
    board: string,
    description: string,
    nsfw = false,
  ): Board {
    return ({
      title,
      board,
      link: `/${ board }/`,
      description,
      nsfw,
    });
  }
}
