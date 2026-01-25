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
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * ============================================================
 *  Bootstrap
 * ============================================================
 */

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  /**
   * ============================================================
   *  Middleware
   * ============================================================
   */

  /**
   * ============================================================
   *  CORS
   * ============================================================
   */

  // Allow all origins - Companion is now served from the same origin
  const allowedOrigins = true;

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
   *  Serve Companion SPA (static files) in production
   * ============================================================
   */

  const clientDistPath = join(__dirname, '..', 'client', 'dist');
  if (existsSync(clientDistPath)) {
    app.useStaticAssets(clientDistPath);
    logger.log(`Serving Companion SPA from ${clientDistPath}`);
    
    // SPA fallback - serve index.html for non-API routes
    app.use((req: any, res: any, next: any) => {
      if (!req.path.startsWith('/api') && !req.path.includes('.')) {
        res.sendFile(join(clientDistPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  /**
   * ============================================================
   *  Start server
   * ============================================================
   */

  const port = Number(process.env.PORT) || 5000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Blood Script Engine API running on port ${port}`);
}

bootstrap();
