import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const rawKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY is not configured');
  }

  const normalized = rawKey.trim();
  let key: Buffer;

  if (/^[0-9a-fA-F]{64}$/.test(normalized)) {
    key = Buffer.from(normalized, 'hex');
  } else {
    key = Buffer.from(normalized, 'base64');
  }

  if (key.length !== 32) {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY must be 32 bytes');
  }

  return key;
}

export function encryptSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]);
  return payload.toString('base64');
}

export function decryptSecret(payload: string): string {
  const key = getEncryptionKey();
  const buffer = Buffer.from(payload, 'base64');
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
