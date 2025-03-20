// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import swaggerConfig from './config/swagger.config';
import { AppLoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ScriptsModule } from './modules/scripts/scripts.module';
import { PublisherModule } from './modules/publisher/publisher.module';
import aiConfig from './config/ai.config';
import { ImagesModule } from './modules/images/images.module';
import { AudiosModule } from './modules/audios/audios.module';
import { VideosModule } from './modules/videos/videos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, swaggerConfig, aiConfig],
    }),
    AuthModule,
    UsersModule,
    ScriptsModule,
    ImagesModule,
    AudiosModule,
    VideosModule,
    PublisherModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLoggerService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LoggingInterceptor,
    },
  ],
  exports: [AppLoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
