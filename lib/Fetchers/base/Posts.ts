import Fetcher from '../base/Fetcher';

export default abstract class Posts extends Fetcher {
  protected static readonly cacheObjectType = 'posts';

  public static async refreshCached<T>(board: string, thread: string): Promise<T[]> {
    return await this._refreshCached<T>({
      board,
      thread,
    });
  }
}
