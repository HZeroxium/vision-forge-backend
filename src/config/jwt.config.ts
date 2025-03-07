// config/jwt.config.ts

export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});
