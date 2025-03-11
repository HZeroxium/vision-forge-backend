// modules/scripts/scripts.module.ts
import { Module } from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { ScriptsController } from './scripts.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [DatabaseModule, ConfigModule, AIModule],
  controllers: [ScriptsController],
  providers: [ScriptsService],
})
export class ScriptsModule {}
