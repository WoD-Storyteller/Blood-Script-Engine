import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerDiscordCommands } from './discord/discord.commands';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await registerDiscordCommands();

  await app.listen(3000);
}
bootstrap();