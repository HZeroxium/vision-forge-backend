// modules/flow/flow.module.ts
import { Module } from '@nestjs/common';
import { FlowService } from './flow.service';
import { FlowController } from './flow.controller';
import { ScriptsModule } from '@scripts/scripts.module';
import { AudiosModule } from '@audios/audios.module';
import { ImagesModule } from '@images/images.module';
import { VideosModule } from '@videos/videos.module';
import { AIModule } from '@ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { ScriptsService } from '@scripts/scripts.service';
import { BullModule } from '@nestjs/bull';
import { FlowProcessor } from './flow.processor';

@Module({
  imports: [
    ConfigModule,
    AIModule,
    ScriptsModule,
    AudiosModule,
    ImagesModule,
    VideosModule,
    BullModule.registerQueue({
      name: 'video-generation',
      defaultJobOptions: {
        attempts: 3, // 🔁 Retry 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Wait 5s, 10s, 20s...
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for inspection
      },
    }),
  ],
  controllers: [FlowController],
  providers: [FlowService, PrismaService, ScriptsService, FlowProcessor],
  exports: [FlowService],
})
export class FlowModule {}
