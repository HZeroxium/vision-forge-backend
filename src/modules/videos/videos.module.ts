// modules/videos/videos.module.ts
import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { PrismaService } from '@database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from '@ai/ai.module';

@Module({
  imports: [ConfigModule, AIModule],
  controllers: [VideosController],
  providers: [VideosService, PrismaService],
  exports: [VideosService],
})
export class VideosModule {}
