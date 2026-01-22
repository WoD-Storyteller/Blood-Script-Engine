exports.up = async function (knex) {
  await knex.raw(`
    BEGIN;

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
      ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

    ALTER TABLE users
      ALTER COLUMN discord_user_id DROP NOT NULL,
      ALTER COLUMN username DROP NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq
      ON users(email)
      WHERE email IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS users_discord_user_id_uq
      ON users(discord_user_id)
      WHERE discord_user_id IS NOT NULL;

    CREATE TABLE IF NOT EXISTS discord_link_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash TEXT NOT NULL UNIQUE,
      discord_user_id TEXT NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      redeemed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS discord_link_tokens_hash_idx
      ON discord_link_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS discord_link_tokens_discord_idx
      ON discord_link_tokens(discord_user_id);

    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      last_ip TEXT,
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions(user_id);

    CREATE TABLE IF NOT EXISTS user_recovery_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      code_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      redeemed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS user_recovery_codes_user_idx
      ON user_recovery_codes(user_id)
      WHERE redeemed_at IS NULL;

    CREATE TABLE IF NOT EXISTS two_factor_pending (
      user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      secret_encrypted TEXT NOT NULL,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    COMMIT;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    BEGIN;

    DROP TABLE IF EXISTS two_factor_pending;
    DROP TABLE IF EXISTS user_recovery_codes;
    DROP TABLE IF EXISTS user_sessions;
    DROP TABLE IF EXISTS discord_link_tokens;

    DROP INDEX IF EXISTS users_email_uq;
    DROP INDEX IF EXISTS users_discord_user_id_uq;

    ALTER TABLE users
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS password_hash,
      DROP COLUMN IF EXISTS two_factor_enabled,
      DROP COLUMN IF EXISTS two_factor_secret,
      DROP COLUMN IF EXISTS is_owner,
      DROP COLUMN IF EXISTS updated_at,
      DROP COLUMN IF EXISTS failed_login_attempts,
      DROP COLUMN IF EXISTS last_failed_login_at,
      DROP COLUMN IF EXISTS locked_until;

    ALTER TABLE users
      ALTER COLUMN discord_user_id SET NOT NULL,
      ALTER COLUMN username SET NOT NULL;

    COMMIT;
  `);
};
