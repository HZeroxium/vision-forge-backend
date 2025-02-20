// common/interceptors/logging.interceptor.ts

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    this.logger.log(`Incoming request: ${method} ${url}`);
    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `Completed ${method} ${url} in ${Date.now() - now}ms`,
          ),
        ),
      );
  }
}
