require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redisConf = {
    password: process.env.REDIS_PASSWORD,
    prefix: 'ThreadPuller:presence:',
    db: process.env.REDIS_DB,
};

const listener = new (require('./lib/DB/Redis'))(redisConf).redis;
const redis = new (require('./lib/DB/Redis'))(redisConf).redis;

async function log() {
    console.clear();
    const keys = await redis.keysAsync(`${redisConf.prefix}*`);

    if (!keys || !keys.length)
        return [];

    const query = await redis.mgetAsync(keys.map(key => key.substr(redisConf.prefix.length)));
    const data = query.map(el => JSON.parse(el));

    data
        .sort((a, b) => {
            if (
                !a.presenceId || !b.presenceId
                || (a.presenceId === b.presenceId)
            )
                return a.date - b.date;

            return a.presenceId.localeCompare(b.presenceId);
        })
        .forEach(({ presenceId, location: { page } }) => console.log(`[${presenceId}]> ${page}`));

    return data;
}

(async () => {
    await log();
    listener.on('message', log);
    listener.subscribe(redisConf.prefix);
})();
