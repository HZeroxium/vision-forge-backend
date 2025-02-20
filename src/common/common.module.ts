// common/common.module.ts

import { Module, Global } from '@nestjs/common';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ValidationPipe } from './pipes/validation.pipe';
import { HttpExceptionFilter } from './exceptions/http-exception.filter';
import { CacheService } from './cache/cache.service';
import { AppLoggerService } from './logger/logger.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    LoggingInterceptor,
    ValidationPipe,
    HttpExceptionFilter,
    {
      provide: CacheService,
      useFactory: (configService: ConfigService, logger: AppLoggerService) => {
        return new CacheService(configService, logger);
      },
      inject: [ConfigService, AppLoggerService],
    },
    AppLoggerService,
  ],
  exports: [
    LoggingInterceptor,
    ValidationPipe,
    HttpExceptionFilter,
    CacheService,
    AppLoggerService,
  ],
})
export class CommonModule {}
