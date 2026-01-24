exports.up = async function (knex) {
  await knex.raw(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS link_tokens (
      link_token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash TEXT NOT NULL UNIQUE,
      discord_user_id TEXT NOT NULL,
      guild_id TEXT,
      engine_id UUID,
      issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      redeemed_at TIMESTAMPTZ,
      issuing_command TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS link_tokens_user_idx ON link_tokens(discord_user_id);
    CREATE INDEX IF NOT EXISTS link_tokens_active_idx
      ON link_tokens(discord_user_id)
      WHERE redeemed_at IS NULL;
    CREATE INDEX IF NOT EXISTS link_tokens_expires_idx ON link_tokens(expires_at);

    INSERT INTO link_tokens (
      token_hash,
      discord_user_id,
      issued_at,
      expires_at,
      redeemed_at,
      issuing_command
    )
    SELECT
      token_hash,
      discord_user_id,
      issued_at,
      expires_at,
      redeemed_at,
      'legacy'
    FROM discord_link_tokens
    ON CONFLICT (token_hash) DO NOTHING;

    DROP TABLE IF EXISTS discord_link_tokens;
    DROP TABLE IF EXISTS oauth_states;

    COMMIT;
  `);
};

exports.down = async function () {
  // no automatic rollback
};
