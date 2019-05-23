const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookie = require('cookie');
const geoip = require('geoip-lite');
const SimpleLogger = require('./lib/Logging/SimpleLogger');
const Redis = require('./lib/DB/Redis');

require('dotenv-safe').load(
    {
        allowEmptyValues: true,
    });

const redisConf = {
    password: process.env.REDIS_PASSWORD,
    prefix: 'ThreadPuller:presence:',
    db: process.env.REDIS_DB,
};
const settingsRedisConf = Object.assign({}, redisConf, { prefix: `ThreadPuller:` });

const redis = new Redis(redisConf).redis;
const sessionSettings = require('./config/session')(new Redis(settingsRedisConf).redis);

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
    const censoredKeys = [ 'ip', 'ua' ];

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

io.on('connection', async (socket) => {
    const { id: sessionId } = socket;
    const { query: { monitor }, headers: { cookie: rawCookie = '', 'user-agent': ua = '' } } = socket.handshake;
    const { threadpuller_presence: presenceId, 'connect.sid': rawSessionId = '' } = cookie.parse(rawCookie);
    const user = await sessionSettings.getSessionUser(rawSessionId);
    const ip = getIp(socket.handshake);
    const geo = getCountry(ip);
    const data = { sessionId, presenceId, geo, ip, ua, location: { page: '/', title: '<i>Loading...</i>', loading: true }, focus: false, date: new Date().getTime() };
    socket.monitoring = Boolean(monitor);

    async function sendData(location = data.location, presenceId = data.presenceId) {
        const payload = JSON.stringify(Object.assign(data, { location, presenceId }));
        await redis.setAsync(`${sessionId}`, payload, 'EX', 3 * 60);
        redis.publish(redisConf.prefix, `j:${payload}`, undefined);

        socket.data = data;

        io.to('monitor').emit('user:update', { type: 'update', loading: Boolean(location.loading), data: censorValue(data) });
    }

    async function removeData() {
        const payload = JSON.stringify(data);
        await redis.delAsync(`${sessionId}`);
        redis.publish(redisConf.prefix, `l:${payload}`, undefined);

        io.to('monitor').emit('user:update', { type: 'leave', loading: false, data: censorValue(data) });
    }

    if (socket.monitoring && user)
        socket.join('monitor');
    else
        sendData();

    socket.on('location', (location, presenceId) => {
        sendData(location, presenceId);
        socket.join(location.page);
    });

    socket.on('focus', (focus) => {
        Object.assign(data, { focus });
        sendData();
    });

    socket.on('disconnect', () => removeData());

    if (user) {
        socket.on('peers', (cb) => {
            if (!isFunction(cb))
                return false;

            const rawData = getSocketDataFor(String(socket.data.location.page));

            cb(rawData);
        });

        socket.on('get:all', (cb) => {
            if (!isFunction(cb))
                return false;

            cb(getSocketData());
        });
    }
});

SimpleLogger.info('Cleaning up...');
clean()
    .then(() => {
        SimpleLogger.info('Starting Presence...');
        server.listen(process.env.PRESENCE_PORT, () => {
            SimpleLogger.info(`Started Presence on port ${process.env.PRESENCE_PORT}`);
        });
    });
