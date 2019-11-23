import Redis from 'ioredis';

export function getInstance() {
    const redis = new Redis(process.env.REDIS_URL);

    redis.defineCommand('clean-old-presence-data', {
        numberOfKeys: 0,
        lua: `
            local keys = redis.call('keys', ARGV[1])
            for i=1,#keys,5000 do
                redis.call('del', unpack(keys, i, math.min(i+4999, #keys)))
            end 
            return keys
        `,
    });

    return redis;
}

export async function callStorage(method, ...args) {
    const redis = getInstance();
    const response = await redis[ method ](...args);
    redis.disconnect();

    return response;
}

export async function publishEvent(key, data) {
    const redis = getInstance();
    const response = await redis.publish(key, data);
    redis.disconnect();

    return response;
}

export function storageArgs(key, ...{ expires, body, ...props }) {
    const value = body ? JSON.stringify(body) : props.value;
    return [
        value ? 'set' : 'get',
        key,
        value,
        expires ? 'EX' : null,
        expires,
    ].filter((arg) => Boolean(arg));
}
