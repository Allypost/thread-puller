import Redis from 'ioredis';

export async function callStorage(method, ...args) {
    const redisClient = new Redis(process.env.REDIS_URL);
    const response = await redisClient[ method ](...args);
    redisClient.disconnect();

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
