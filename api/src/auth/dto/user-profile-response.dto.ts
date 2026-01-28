import { Role } from 'src/generated/prisma/client';

export class UserProfileResponseDto {
  id: string;
  email: string;
  role: Role;
  firstname: string;
  lastname: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}