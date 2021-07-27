import BoardInfo from '../../Formatters/BunkerChan/BoardInfo';
import type {
  Board,
} from '../../Types/BunkerChan/local';
import type {
  BunkerChanBoardIndex,
} from '../../Types/BunkerChan/remote';
import BoardsBase from '../base/Boards';
import {
  get,
} from './helpers';

export default class Boards extends BoardsBase {
  static siteName = 'BunkerChan';

  public static async get(): Promise<Board[]> {
    return await this._get<Board>() || [];
  }

  public static async getLive(): Promise<Board[]> {
    const url = 'https://leftypol.org/status.php';
    const boardIndex = await get<BunkerChanBoardIndex, null>(url);

    return (
      boardIndex
        ?.boards
        .map(
          (board) =>
            BoardInfo.parse(board)
          ,
        )
      || []
    );
  }

  public static async refreshCached(): Promise<Board[]> {
    return await this._refreshCached<Board>();
  }
}
