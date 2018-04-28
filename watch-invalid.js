const redisCLI = require('redis');

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redisOpts = {
    password: process.env.REDIS_PASSWORD,
    prefix: 'ThreadPuller:',
    db: process.env.REDIS_DB,
    retry_strategy(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            console.log('|> ERR', options.error);
            return new Error('The server refused the connection');
        }

        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            const err = new Error('Retry time exhausted');
            console.log('|> ERR', err);

            return err;
        }

        if (options.attempt > 10)
        // End reconnecting with built in error
            return undefined;

        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    },
};

const redis = !+process.env.THREADPULLER_IGNORE_REDIS_CACHE
              ? redisCLI.createClient(redisOpts)
              : null;

if (!redis)
    return console.error(`Can't conenct to redis...`);

redis.on('message', console.log);

redis.subscribe('invalid-request');
