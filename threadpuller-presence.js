const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const SimpleLogger = require('./lib/Logging/SimpleLogger');

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redisConf = {
    password: process.env.REDIS_PASSWORD,
    prefix: 'ThreadPuller:presence:',
    db: process.env.REDIS_DB,
};

const redis = new (require('./lib/DB/Redis'))(redisConf).redis;

async function clean() {
    const command = `local keys = redis.call('keys', ARGV[1]) \n for i=1,#keys,5000 do \n redis.call('del', unpack(keys, i, math.min(i+4999, #keys))) \n end \n return keys`;
    return await redis.evalAsync(command, 0, `${redisConf.prefix}*`);
}

io.on('connection', (socket) => {
    const { id } = socket;
    const { address } = socket.handshake;

    socket.on('location', async (location) => {
        const data = { id, address, location };
        const payload = JSON.stringify(data);
        await redis.setAsync(`${id}`, payload, 'EX', 3 * 60);
        redis.publish(redisConf.prefix, `j:${payload}`);
    });

    socket.on('disconnect', async () => {
        const data = { id, address };
        const payload = JSON.stringify(data);
        await redis.delAsync(`${id}`);
        redis.publish(redisConf.prefix, `l:${payload}`);
    });
});

SimpleLogger.info('Cleaning up...');
clean()
    .then(() => {
        SimpleLogger.info('Starting Presence...');
        server.listen(process.env.THREADPULLER_PRESENCE_PORT, () => {
            SimpleLogger.info(`Started Presence on port ${process.env.THREADPULLER_PRESENCE_PORT}`);
        });
    });
