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
   * CORS CONFIGURATION
   * --------------------------------------------------
   * Browser-based access ONLY
   * Auth:
   * - Authorization: Bearer <token>
   * - No cookies
   */
  app.enableCors({
    origin: [
      'https://app.bloodscriptengine.tech',
      'https://bloodscriptengine.tech',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: false,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Blood Script Engine running on port ${port}`);
}

bootstrap();