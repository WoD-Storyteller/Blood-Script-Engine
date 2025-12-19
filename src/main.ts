import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appUrl = process.env.COMPANION_APP_URL || 'http://localhost:5173';

  app.use(cookieParser());

  app.enableCors({
    origin: appUrl,
    credentials: true,
  });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();