// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import 'dotenv/config';
import { AppLoggerService } from './common/logger/logger.service';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Logger
  const loggerService = app.get(AppLoggerService);
  app.useLogger(loggerService);

  // Exceptions
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  const configService = app.get(ConfigService);

  // Log the global prefix configuration
  const apiPrefix = configService.get<string>('apiPrefix')!;
  loggerService.log(`Setting global prefix: ${apiPrefix}`);
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  if (configService.get<boolean>('cors.enabled')) {
    app.enableCors({ origin: configService.get<string>('cors.origin') });
    loggerService.log('✅ CORS enabled');
  }

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get<string>('swagger.title')!)
    .setDescription(configService.get<string>('swagger.description')!)
    .setVersion(configService.get<string>('swagger.version')!)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(
    configService.get<string>('swagger.path')!,
    app,
    document,
  );

  // Start server
  const PORT = configService.get<number>('port')!;
  loggerService.log(`Server running on port ${PORT}`);

  // Bull Board
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const videoQueue = app.get<Queue>(getQueueToken('video-generation'));

  createBullBoard({
    queues: [new BullAdapter(videoQueue)],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  await app.listen(PORT);
}
bootstrap();
