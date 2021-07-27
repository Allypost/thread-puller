import Fetcher from '../base/Fetcher';

type Board = {
  board: string;
};

export default abstract class Boards extends Fetcher {
  protected static readonly cacheObjectType = 'boards';

  public static async info<T extends Board>(board: string): Promise<T | null> {
    const boards = await this._get<T>();

    return boards.find((b) => b.board === board) || null;
  }
}
