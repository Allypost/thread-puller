const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookie = require('cookie');
const geoip = require('geoip-lite');
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

function getIp(handshake) {
    const { address, headers = {} } = handshake;
    const { 'cf-connecting-ip': cfAddress, 'x-real-ip': realIp } = headers;

    return cfAddress || realIp || address;
}

function getCountry(ip) {
    const { country, region, city } = geoip.lookup(ip) || {};

    return { country, region, city };
}

io.on('connection', (socket) => {
    const { id } = socket;
    const { headers: { cookie: rawCookie, 'user-agent': ua } } = socket.handshake;
    const { threadpuller_presence: presenceId } = cookie.parse(rawCookie);
    const ip = getIp(socket.handshake);
    const geo = getCountry(ip);
    const data = { id, presenceId, geo, ip, ua, date: new Date().getTime() };

    async function sendData(location = { page: '/', title: '<i>Loading...</i>' }) {
        const payload = JSON.stringify(Object.assign(data, { location, date: new Date().getTime() }));
        await redis.setAsync(`${id}`, payload, 'EX', 3 * 60);
        redis.publish(redisConf.prefix, `j:${payload}`);
    }

    sendData();

    socket.on('location', (location) => data.location && sendData(location));

    socket.on('disconnect', async () => {
        const payload = JSON.stringify(data);
        await redis.delAsync(`${id}`);
        redis.publish(redisConf.prefix, `l:${payload}`);
    });
});

SimpleLogger.info('Cleaning up...');
clean()
    .then(() => {
        SimpleLogger.info('Starting Presence...');
        server.listen(process.env.PRESENCE_PORT, () => {
            SimpleLogger.info(`Started Presence on port ${process.env.PRESENCE_PORT}`);
        });
    });
