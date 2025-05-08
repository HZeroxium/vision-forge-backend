// modules/publisher/publisher.module.ts

import { Module } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublisherController } from './publisher.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { YouTubeModule } from '@/modules/youtube/youtube.module';

@Module({
  imports: [ConfigModule, YouTubeModule],
  controllers: [PublisherController],
  providers: [PublisherService, PrismaService],
  exports: [PublisherService],
})
export class PublisherModule {}
