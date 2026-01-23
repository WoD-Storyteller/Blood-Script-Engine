exports.up = async function (knex) {
  await knex.raw(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      redeemed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
      ON password_reset_tokens(user_id)
      WHERE redeemed_at IS NULL;

    CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_idx
      ON password_reset_tokens(expires_at)
      WHERE redeemed_at IS NULL;

    COMMIT;
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    BEGIN;

    DROP TABLE IF EXISTS password_reset_tokens;

    COMMIT;
  `);
};
