import { Logger } from '@nestjs/common';

const logger = new Logger('Secrets');

export async function loadSecrets() {
  const required = [
    'DATABASE_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DISCORD_OWNER_ID',
    'JWT_SECRET',
    'APP_BASE_URL',
    'APP_URL',
  ];

  const optional = [
    'DISCORD_BOT_TOKEN',
    'SESSION_SECRET',
    'GEMINI_API_KEY',
    'BOT_OWNER_DISCORD_ID',
    'COMPANION_APP_URL',
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
