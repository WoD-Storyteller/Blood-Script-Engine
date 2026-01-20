/**
 * ============================================================
 *  Environment bootstrap MUST happen before ANY other imports
 * ============================================================
 */

import 'reflect-metadata';

// 🔑 Load environment variables first
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env',
});

/**
 * ============================================================
 *  NestJS imports AFTER env is loaded
 * ============================================================
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

/**
 * ============================================================
 *  Bootstrap
 * ============================================================
 */

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  /**
   * ============================================================
   *  Middleware
   * ============================================================
   */

  // 🍪 Required for session / auth cookies
  app.use(cookieParser());

  /**
   * ============================================================
   *  CORS
   * ============================================================
   */

  const allowedOrigins =
    process.env.NODE_ENV === 'production'
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

  /**
   * ============================================================
   *  Global API config
   * ============================================================
   */

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * ============================================================
   *  Start server
   * ============================================================
   */

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '127.0.0.1');

  logger.log(`Blood Script Engine API running on port ${port}`);
}

bootstrap();