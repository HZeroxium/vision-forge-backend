// modules/youtube/youtube.module.ts
import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { YouTubeController } from './youtube.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [YouTubeController],
  providers: [YouTubeService, PrismaService],
  exports: [YouTubeService],
})
export class YouTubeModule {}
