// modules/images/images.module.ts
import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { PrismaService } from 'src/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [ConfigModule, AIModule],
  controllers: [ImagesController],
  providers: [ImagesService, PrismaService],
  exports: [ImagesService],
})
export class ImagesModule {}
