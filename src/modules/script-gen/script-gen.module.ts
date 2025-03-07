// modules/script-gen/script-gen.module.ts
import { Module } from '@nestjs/common';
import { ScriptGenService } from './script-gen.service';
import { ScriptGenController } from './script-gen.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    HttpModule, // For API calls
    ConfigModule, // For accessing environment variables
    DatabaseModule, // For Prisma integration
  ],
  controllers: [ScriptGenController],
  providers: [ScriptGenService],
  exports: [ScriptGenService],
})
export class ScriptGenModule {}
