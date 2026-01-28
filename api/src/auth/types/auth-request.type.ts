import { Request } from 'express';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';
import type { User } from 'src/generated/prisma/client';

export interface AuthRequest extends Request {
  user: JwtPayloadDto;
}

export interface AuthRequestWithUser extends Request {
  user: Omit<User, 'password'>;
}