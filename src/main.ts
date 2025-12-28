import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadSecrets } from './config/secrets';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // 🔐 Load secrets from Google Secret Manager FIRST
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
   * Required for:
   * - Companion App (VM2, browser-based)
   * - Future website integration
   *
   * Auth model:
   * - Authorization: Bearer <token>
   * - NO cookies
   * - NO credentials
   */
  app.enableCors({
    origin: [
      // Companion App (private VM)
      'http://10.10.0.4',

      // Local development
      'http://localhost:5173',
      'http://localhost:3000',

      // Future domains
      'https://app.bloodscriptengine.tech',
      'https://bloodscriptengine.tech',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: false,
  });


  // Global validation (safe defaults)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS for companion app
  const companionUrl = process.env.COMPANION_APP_URL;
  if (companionUrl) {
    app.enableCors({
      origin: companionUrl,
      credentials: true,
    });
    logger.log(`CORS enabled for ${companionUrl}`);
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  logger.log(`Blood Script Engine running on port ${port}`);
}

bootstrap();
