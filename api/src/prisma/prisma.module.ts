import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import PrismaConfig from 'src/prisma/prisma.config';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [ConfigModule.forFeature(PrismaConfig)],
  exports: [PrismaService],
  providers: [PrismaService],
})
export class PrismaModule {}
