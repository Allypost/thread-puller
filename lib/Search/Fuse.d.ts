import type FuseClass from 'fuse.js';

declare const Fuse: <T>(
  list: ReadonlyArray<T>,
  keys?: FuseClass.FuseOptionKey[],
  opts?: FuseClass.FuseIndex<T>,
) => FuseClass<T>;
