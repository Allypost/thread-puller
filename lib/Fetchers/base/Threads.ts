import Fetcher from '../base/Fetcher';

export default abstract class Threads extends Fetcher {
  protected static readonly cacheObjectType = 'threads';
}
