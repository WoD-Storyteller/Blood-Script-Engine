import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadSecrets } from './config/secrets';
import { Logger, ValidationPipe } from '@nestjs/common';

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
   * ✅ CORS CONFIG — FIXED
   * --------------------------------------------------
   * Supports:
   * - Companion App (cookies)
   * - Bearer tokens
   * - NGINX proxy
   * - IP-based dev
   */
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://app.bloodscriptengine.tech',
        'https://bloodscriptengine.tech',
        'http://localhost',
        'http://localhost:5173',
        'http://10.10.0.5:5173',
        'http://10.10.0.2',
      ];

      // Allow server-to-server & curl
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    },

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // IMPORTANT: this must match nginx proxy
  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Blood Script Engine running on port ${port}`);
}

bootstrap();