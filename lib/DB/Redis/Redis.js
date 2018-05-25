const redisCLI = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redisCLI.RedisClient.prototype);
bluebird.promisifyAll(redisCLI.Multi.prototype);

class Redis {

    constructor(dbConfig) {
        this.config = dbConfig;

        if (process.env.THREADPULLER_IGNORE_REDIS_CACHE)
            this.redis = null;
        else
            this.redis = this.create();
    }

    create(config) {
        config = config || this.config;

        if (!config.hasOwnProperty('retry_strategy'))
            Object.assign(config, { retry_strategy: this.constructor.retryStrategy.bind(this) });

        return redisCLI.createClient(config);
    }

    static retryStrategy(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            console.log('|> ERR', options.error);
            throw new Error('The server refused the connection');
        }

        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            const err = new Error('Retry time exhausted');
            console.log('|> ERR', err);

            throw err;
        }

        if (options.attempt > 10)
        // End reconnecting with built in error
            return undefined;

        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    }

}

module.exports = Redis;
