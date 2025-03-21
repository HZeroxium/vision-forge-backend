// modules/flow/flow.module.ts
import { Module } from '@nestjs/common';
import { FlowService } from './flow.service';
import { FlowController } from './flow.controller';
import { ScriptsModule } from 'src/modules/scripts/scripts.module';
import { AudiosModule } from 'src/modules/audios/audios.module';
import { ImagesModule } from 'src/modules/images/images.module';
import { VideosModule } from 'src/modules/videos/videos.module';
import { AIModule } from 'src/ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/database/prisma.service';
import { ScriptsService } from '../scripts/scripts.service';

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
