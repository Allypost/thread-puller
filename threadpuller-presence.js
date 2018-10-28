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

function isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
}

function getSocketData(socketIds = null, censored = true) {
    const { sockets } = io.sockets;
    const ids = socketIds || Object.keys(sockets);

    const rawData =
              ids
                  .filter((key) => !sockets[ key ].monitoring)
                  .map((key) => ([ key, sockets[ key ].data ]))
                  .reduce((acc, [ k, v ]) => Object.assign(acc, { [ k ]: v }), {});

    if (censored)
        return censorData(rawData);

    return rawData;
}

function getSocketDataFor(room, censored = true) {
    const { sockets: potentialKeys = {} } = io.sockets.adapter.rooms[ room ] || {};

    const keys =
              Object.entries(potentialKeys)
                    .filter(([ _, v ]) => v)
                    .map(([ key ]) => key);

    return getSocketData(keys, censored);
}

function censorValue(rawValue) {
    const censoredKeys = [ 'ip', 'ua', 'id' ];

    return (
        Object.entries(rawValue)
              .filter(([ key ]) => !censoredKeys.includes(key))
              .reduce((acc, [ k, v ]) => Object.assign(acc, { [ k ]: v }), {})
    );
}

function censorData(rawData) {
    return (
        Object.entries(rawData)
              .map(([ key, value ]) => ([ key, censorValue(value) ]))
              .reduce((acc, [ k, v ]) => Object.assign(acc, { [ k ]: v }), {})
    );
}

io.on('connection', (socket) => {
    const { id } = socket;
    const { query: { monitor }, headers: { cookie: rawCookie = '', 'user-agent': ua = '' } } = socket.handshake;
    const { threadpuller_presence: presenceId } = cookie.parse(rawCookie);
    const ip = getIp(socket.handshake);
    const geo = getCountry(ip);
    const data = { id, presenceId, geo, ip, ua, date: new Date().getTime() };
    socket.monitoring = Boolean(monitor);

    async function sendData(location = { page: '/', title: '<i>Loading...</i>', loading: true }, presenceId = data.presenceId) {
        const payload = JSON.stringify(Object.assign(data, { location, presenceId }));
        await redis.setAsync(`${id}`, payload, 'EX', 3 * 60);
        redis.publish(redisConf.prefix, `j:${payload}`);

        socket.data = data;

        io.to('monitor').emit('user:update', { type: 'update', loading: Boolean(location.loading), data: censorValue(data) });
    }

    async function removeData() {
        const payload = JSON.stringify(data);
        await redis.delAsync(`${id}`);
        redis.publish(redisConf.prefix, `l:${payload}`);

        io.to('monitor').emit('user:update', { type: 'leave', loading: false, data: censorValue(data) });
    }

    if (socket.monitoring)
        socket.join('monitor');
    else
        sendData();

    socket.on('location', (location, presenceId) => {
        sendData(location, presenceId);
        socket.join(location.page);
    });

    socket.on('disconnect', () => removeData());

    socket.on('peers', (cb) => {
        if (!isFunction(cb))
            return false;

        const rawData = getSocketDataFor(String(socket.data.location.page));

        cb(rawData);
    });

    socket.on('all', (cb) => {
        if (!isFunction(cb))
            return false;

        cb(getSocketData());
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
