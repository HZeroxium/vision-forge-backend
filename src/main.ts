// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import 'dotenv/config';
import { AppLoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Logger
  const loggerService = app.get(AppLoggerService);
  app.useLogger(loggerService);

  // Exceptions
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  const configService = app.get(ConfigService);

  // Set global prefix
  app.setGlobalPrefix(configService.get<string>('apiPrefix')!);

  // Enable CORS
  if (configService.get<boolean>('cors.enabled')) {
    app.enableCors({ origin: configService.get<string>('cors.origin') });
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

  await app.listen(PORT);
}
bootstrap();
