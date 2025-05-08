// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingMiddleware } from '@common/middleware/logging.middleware';
import { ConfigModule } from '@nestjs/config';
import appConfig from '@config/app.config';
import swaggerConfig from '@config/swagger.config';
import aiConfig from '@config/ai.config';
import cacheConfig from '@config/redis.config';
import { AppLoggerService } from '@common/logger/logger.service';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { ScriptsModule } from '@scripts/scripts.module';
import { PublisherModule } from '@publisher/publisher.module';
import { ImagesModule } from '@images/images.module';
import { AudiosModule } from '@audios/audios.module';
import { VideosModule } from '@videos/videos.module';
import { FlowModule } from '@flow/flow.module';
import { BullModule } from '@nestjs/bull';
import { YouTubeModule } from './modules/youtube/youtube.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, swaggerConfig, aiConfig, cacheConfig],
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    AuthModule,
    UsersModule,
    ScriptsModule,
    ImagesModule,
    AudiosModule,
    VideosModule,
    FlowModule,
    PublisherModule,
    YouTubeModule,
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
