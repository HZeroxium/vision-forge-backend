// common/common.module.ts

import { Module, Global } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ValidationPipe } from './pipes/validation.pipe';
import { HttpExceptionFilter } from './exceptions/http-exception.filter';
import { CacheService } from './cache/cache.service';
import { AppLoggerService } from './logger/logger.service';

@Global()
@Module({
  providers: [
    AuthGuard,
    LoggingInterceptor,
    ValidationPipe,
    HttpExceptionFilter,
    CacheService,
    AppLoggerService,
  ],
  exports: [
    AuthGuard,
    LoggingInterceptor,
    ValidationPipe,
    HttpExceptionFilter,
    CacheService,
    AppLoggerService,
  ],
})
export class CommonModule {}
