// modules/audios/audios.module.ts
import { Module } from '@nestjs/common';
import { AudiosService } from './audios.service';
import { AudiosController } from './audios.controller';
import { PrismaService } from 'src/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from 'src/ai/ai.module';
import { ScriptsModule } from '../scripts/scripts.module';
import { ScriptsService } from '../scripts/scripts.service';

@Module({
  imports: [ConfigModule, AIModule, ScriptsModule],
  controllers: [AudiosController],
  providers: [AudiosService, PrismaService, ScriptsService],
  exports: [AudiosService],
})
export class AudiosModule {}
