import FuseClass from 'fuse.js';

export const options = {
  shouldSort: true,
  includeScore: true,
  threshold: 0.45,
  location: 0,
  distance: 100,
  minMatchCharLength: 1,
};

export const Fuse =
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    (list, keys = [], opts = options) =>
      new FuseClass(
        list,
        {
          ...opts,
          keys,
        },
      )
;
