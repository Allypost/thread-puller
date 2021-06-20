import BoardsBase from '../base/Boards';
import {
  get,
} from './helpers';

export default class Boards extends BoardsBase {
  static siteName = 'FourChan';

  static async _getLive() {
    const url = 'https://a.4cdn.org/boards.json';
    const { boards } = await get(url);

    if (!boards) {
      return [];
    }

    // noinspection JSUnresolvedVariable
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
}
