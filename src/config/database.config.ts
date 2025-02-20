// config/database.config.ts

export default () => ({
  database: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mydb',
    synchronize: process.env.DB_SYNC === 'true',
  },
  prisma: {
    databaseUrl:
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/mydb?schema=public',
  },
});
