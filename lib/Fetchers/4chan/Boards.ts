import type {
  Board,
} from '../../Types/4chan/local';
import type {
  FourChanResponse,
} from '../../Types/4chan/remote';
import BoardsBase from '../base/Boards';
import {
  get,
} from './helpers';

export default class Boards extends BoardsBase {
  protected static readonly siteName = 'FourChan';

  public static async get(): Promise<Board[]> {
    return await this._get<Board>() || [];
  }

  public static async getLive(): Promise<Board[]> {
    const url = 'https://a.4cdn.org/boards.json';
    const { boards } = await get<FourChanResponse, Record<string, undefined>>(url);

    if (!boards) {
      return [];
    }

    return (
      boards
        .map((board) => (
          {
            title: board.title,
            board: board.board,
            link: `/${ board.board }/`,
            description: board.meta_description,
            nsfw: !board.ws_board,
          }
        ))
    );
  }

  public static async refreshCached(): Promise<Board[]> {
    return await this._refreshCached<Board>();
  }
}
