import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadSecrets } from './config/secrets';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 🔐 Load secrets FIRST
  try {
    await loadSecrets();
    logger.log('Secrets loaded successfully');
  } catch (err) {
    logger.error('Failed to load secrets', err);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  /**
   * ✅ REQUIRED FOR SESSION MIDDLEWARE
   * ---------------------------------
   * Populates req.cookies
   */
  app.use(cookieParser());

  /**
   * ✅ CORS CONFIG
   */
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://bloodscriptengine.tech',
        'https://www.bloodscriptengine.tech',
        'https://app.bloodscriptengine.tech',
      ]
    : true;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Blood Script Engine API running on port ${port}`);
}

bootstrap();