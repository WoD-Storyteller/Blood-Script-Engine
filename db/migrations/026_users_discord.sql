BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_discord_user_id_uq
  ON users(discord_user_id)
  WHERE discord_user_id IS NOT NULL;

COMMIT;