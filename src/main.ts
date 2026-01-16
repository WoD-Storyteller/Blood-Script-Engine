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
   * ✅ CORS CONFIG - Allow all origins for Replit environment
   */
  app.enableCors({
    origin: true,
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

  const port = Number(process.env.PORT) || 5000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Blood Script Engine running on port ${port}`);
}

bootstrap();