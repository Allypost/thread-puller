import BoardInfo from '../../Formatters/BunkerChan/BoardInfo';
import BoardsBase from '../base/Boards';
import {
  get,
} from './helpers';


export default class Boards extends BoardsBase {
  static siteName = 'BunkerChan';

  static async _getLive() {
    const url = 'https://bunkerchan.xyz/boards.js?json=1';
    const { data = {} } = await get(url);
    const { boards } = data;

    if (!boards) {
      return [];
    }

    const boardParser = BoardInfo.parse.bind(null);

    return boards.map(boardParser);
  }
}
