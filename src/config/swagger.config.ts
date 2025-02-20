// config/swagger.config.ts

export default () => ({
  swagger: {
    title: process.env.SWAGGER_TITLE || 'API Documentation',
    description: process.env.SWAGGER_DESCRIPTION || 'NestJS API',
    version: process.env.SWAGGER_VERSION || '1.0',
    path: process.env.SWAGGER_PATH || 'docs',
  },
});
