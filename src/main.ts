import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import { existsSync, mkdirSync } from 'fs';
async function bootstrap() {
  // Create upload directory if it doesn't exist
  const uploadDir = './uploads';
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  // Create NestJS application
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3001;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api';
  const nodeEnv = configService.get<string>('nodeEnv') || 'development';

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors();

  // Use Helmet for security headers
  app.use(helmet());

  // Use compression
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setDescription('E-Commerce Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  // Start the server
  await app.listen(port);

  Logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`, 'Bootstrap');

  if (nodeEnv !== 'production') {
    Logger.log(
      `📝 Swagger documentation is available at: http://localhost:${port}/${apiPrefix}/docs`,
      'Bootstrap',
    );
  }
}
void bootstrap();
