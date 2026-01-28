import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }
  return {
    secret: jwtSecret,
  };
});
