import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function getSecret(name: string): Promise<string> {
  const projectId =
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT;

  if (!projectId) {
    throw new Error('GCP project ID not set');
  }

  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/latest`,
  });

  const value = version.payload?.data?.toString();
  if (!value) throw new Error(`Secret ${name} is empty`);

  return value;
}

export async function loadSecrets() {
  const required = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_SECRET',
    'SESSION_SECRET',
    'DATABASE_URL',
    'GEMINI_API_KEY',
    'BOT_OWNER_DISCORD_ID', // ✅ NEW
  ];

  for (const key of required) {
    if (!process.env[key]) {
      process.env[key] = await getSecret(key);
    }
  }
}
