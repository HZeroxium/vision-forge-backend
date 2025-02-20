// config/app.config.ts

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },
  apiPrefix: process.env.API_PREFIX || 'api',
});
