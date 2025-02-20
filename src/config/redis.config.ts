// config/redis.config.ts

export default () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10) || 3600,
  },
});
