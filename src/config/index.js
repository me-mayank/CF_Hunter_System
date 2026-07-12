import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cfApiBase: process.env.CF_API_BASE || 'https://codeforces.com/api',
  engineVersion: process.env.ENGINE_VERSION || '1.0.0',
};
