const session = require('express-session');
const randomBytes = require('crypto').randomBytes;
const RedisSession = require('connect-redis')(session);
const cookieSignature = require('cookie-signature');
const { unserialize } = require('./passport');

const config = {
    secret: process.env.THREADPULLER_SESSION_SECRET || randomBytes(256).toString(),
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: 'auto',
    },
};

module.config = config;

/**
 * @param {RedisClient} [redis]
 * @return {{saveUninitialized: boolean, secret: string, resave: boolean, [store]: RedisSession}}
 */
module.exports = (redis = null) => {
    const newConfig = Object.assign({}, config);

    if (!redis)
        return newConfig;

    newConfig.store = new RedisSession({ client: redis });

    newConfig.getSessionData = function (rawSessionId) {
        if (
            !rawSessionId
            || !rawSessionId.length
        )
            return Promise.resolve(null);

        const sessionId = cookieSignature.unsign(rawSessionId.slice(2), this.secret);

        if(!sessionId)
            return Promise.resolve(null);

        const { store } = this;

        return new Promise((resolve) => store.get(sessionId, (_, data) => resolve(data)));
    };

    newConfig.getSessionUser = async function (sessionId) {
        const data = await this.getSessionData(sessionId);

        if (!data)
            return null;

        const { passport } = data;

        if (!passport)
            return null;

        const { user } = passport;

        if (!user)
            return null;

        return (await unserialize(user)).res;
    };

    return newConfig;
};
