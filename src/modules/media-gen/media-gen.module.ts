// modules/media-gen/media-gen.module.ts

import { Module } from '@nestjs/common';
import { MediaGenService } from './media-gen.service';
import { MediaGenController } from './media-gen.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    HttpModule, // For making API calls
    ConfigModule, // To access environment variables
    DatabaseModule, // For Prisma integration
  ],
  controllers: [MediaGenController],
  providers: [MediaGenService],
  exports: [MediaGenService],
})
export class MediaGenModule {}
