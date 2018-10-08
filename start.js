const concurrently = require('concurrently');

concurrently(
    [ 'npm:start-*' ],
    {
        prefix: 'name',
        restartTries: 4,
        restartDelay: 250,
    },
);
