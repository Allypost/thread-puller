import FuseClass from 'fuse.js';

export const options = {
    shouldSort: true,
    includeScore: true,
    threshold: 0.45,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
};

export const Fuse = (list, keys = [], opts = options) => new FuseClass(list, { ...opts, keys });
