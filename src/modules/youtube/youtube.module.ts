// modules/youtube/youtube.module.ts
import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { YouTubeController } from './youtube.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/cache/cache.service';
import { YouTubeAuthService } from './services/youtube-auth.service';
import { YouTubeVideoService } from './services/youtube-video.service';
import { YouTubeAnalyticsService } from './services/youtube-analytics.service';
import { YouTubeFormatterService } from './services/youtube-formatter.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [YouTubeController],
  providers: [
    YouTubeService,
    YouTubeAuthService,
    YouTubeVideoService,
    YouTubeAnalyticsService,
    YouTubeFormatterService,
    PrismaService,
    CacheService,
  ],
  exports: [YouTubeService],
})
export class YouTubeModule {}
