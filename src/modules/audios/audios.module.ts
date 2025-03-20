// modules/audios/audios.module.ts
import { Module } from '@nestjs/common';
import { AudiosService } from './audios.service';
import { AudiosController } from './audios.controller';
import { PrismaService } from 'src/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [ConfigModule, AIModule],
  controllers: [AudiosController],
  providers: [AudiosService, PrismaService],
  exports: [AudiosService],
})
export class AudiosModule {}
