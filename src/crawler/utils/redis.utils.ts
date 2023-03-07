import Redis from 'ioredis';

export const createRedisClient = () =>
  new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  });
