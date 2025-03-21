// modules/publisher/publisher.module.ts

import { Module } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublisherController } from './publisher.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database/database.module';

@Module({
  imports: [
    HttpModule, // For external API calls
    ConfigModule, // To access environment variables
    DatabaseModule, // For Prisma integration
  ],
  controllers: [PublisherController],
  providers: [PublisherService],
  exports: [PublisherService],
})
export class PublisherModule {}
