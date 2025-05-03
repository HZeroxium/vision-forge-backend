// config/redis.config.ts

export default () => ({
  redis: {
    enabled: process.env.ENABLE_REDIS === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
    dataCache: {
      enabled: process.env.ENABLE_DATA_CACHE === 'true',
    },
    authCache: {
      enabled: process.env.ENABLE_AUTH_CACHE !== 'false', // mặc định là true
    },
    jobCache: {
      enabled: process.env.ENABLE_JOB_CACHE !== 'false', // mặc định là true
    },
  },
});
