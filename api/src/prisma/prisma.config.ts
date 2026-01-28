import { registerAs } from '@nestjs/config';

export default registerAs('prisma', () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }
  return {
    databaseUrl,
  };
});
