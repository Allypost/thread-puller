import Redis from 'ioredis';

export function getInstance() {
  return new Redis(process.env.REDIS_URL);
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
