import { Injectable } from '@nestjs/common';
import { Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {
  }
  async findOneByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  async create(
    email: string,
    hashedPassword: string,
    firstname: string,
    lastname: string,
    role: Role = Role.CLIENT,
  ) {
    return this.prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
        role,
      },
    });
  }

  async findProfileById(id: string) {
    const user = this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstname: true,
        lastname: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user ?? null;
  }
}
