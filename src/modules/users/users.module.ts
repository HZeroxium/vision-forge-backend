// modules/users/users.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from '@database/database.module';
import { CommonModule } from '@common/common.module';
import { UserMapper } from './mappers/user.mapper';

@Module({
  imports: [DatabaseModule, CommonModule],
  providers: [UsersService, UserMapper],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
