import { Logger } from '@nestjs/common';

const logger = new Logger('Secrets');

export async function loadSecrets() {
  const required = [
    'DATABASE_URL',
  ];

  const optional = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_SECRET',
    'SESSION_SECRET',
    'GEMINI_API_KEY',
    'BOT_OWNER_DISCORD_ID',
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  for (const key of optional) {
    if (!process.env[key]) {
      logger.warn(`Optional environment variable ${key} is not set`);
    }
  }

  logger.log('Environment variables validated');
}
