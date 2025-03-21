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

@Module({
  imports: [
    ConfigModule,
    AIModule,
    ScriptsModule,
    AudiosModule,
    ImagesModule,
    VideosModule,
  ],
  controllers: [FlowController],
  providers: [FlowService, PrismaService, ScriptsService],
  exports: [FlowService],
})
export class FlowModule {}
