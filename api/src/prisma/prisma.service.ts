import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import PrismaConfig from 'src/prisma/prisma.config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(
    @Inject(PrismaConfig.KEY)
    private readonly prismaConfiguration: ConfigType<typeof PrismaConfig>,
  ) {
    const adapter = new PrismaPg({
      connectionString: prismaConfiguration.databaseUrl,
    });

    super({ adapter });
  }
}
