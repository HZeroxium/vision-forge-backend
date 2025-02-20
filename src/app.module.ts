// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import swaggerConfig from './config/swagger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ✅ Đảm bảo ConfigModule hoạt động toàn cục
      load: [appConfig, swaggerConfig], // ✅ Nạp cấu hình từ app.config.ts
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
