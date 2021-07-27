import Redis from 'ioredis';

let redisInstance: Redis.Redis;

export function getInstance(): Redis.Redis {
  if (!redisInstance) {
    redisInstance = new Redis(
      process.env.REDIS_URL,
      {
        dropBufferSupport: true,
      },
    );
  }

  return redisInstance;
}

export async function callStorage(
  method: 'get',
  key: Redis.KeyType,
): Promise<string | null>;
export async function callStorage(
  method: 'set',
  key: Redis.KeyType,
  value: Redis.ValueType,
  expiryMode?: string,
  time?: number | string,
  setMode?: number | string,
): Promise<Redis.Ok | null>;
export async function callStorage(
  method: 'del',
  ...keys: Redis.KeyType[]
): Promise<void>;
export async function callStorage(
  method: 'lpop',
  key: Redis.KeyType,
  count?: 1,
): Promise<string>;
export async function callStorage(
  method: 'lpop',
  key: Redis.KeyType,
  count: number,
): Promise<string[]>;
export async function callStorage(
  method: 'rpush',
  key: Redis.KeyType,
  ...values: Redis.ValueType[]
): Promise<void>;
export async function callStorage(
  method: keyof Redis.Commands,
  ...args: unknown[]
): Promise<unknown> {
  const redis = getInstance();
  try {
    const fn = redis[ method ].bind(redis) as (...args: unknown[]) => Promise<unknown>;

    return await fn(...args);
  } catch {
    return null;
  }
}

export async function publishEvent(key: string, data: string): Promise<number> {
  const redis = getInstance();

  return await redis.publish(key, data);
}
