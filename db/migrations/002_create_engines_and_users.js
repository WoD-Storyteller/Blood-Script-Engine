exports.up = async function (knex) {
  await knex.raw(`
    -- Enable UUID generation (safe if already enabled)
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Engines (one per Discord server)
    CREATE TABLE IF NOT EXISTS engines (
      engine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      discord_guild_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status engine_status NOT NULL DEFAULT 'active',
      seed_chronicle_id UUID,
      config JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Users (global across engines)
    CREATE TABLE IF NOT EXISTS users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      discord_user_id TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Engine memberships (roles per engine)
    CREATE TABLE IF NOT EXISTS engine_memberships (
      engine_id UUID NOT NULL REFERENCES engines(engine_id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      role engine_role NOT NULL DEFAULT 'player',
      role_source role_source NOT NULL DEFAULT 'assigned',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (engine_id, user_id)
    );

    -- Snapshot of Discord ownership (audit / recovery)
    CREATE TABLE IF NOT EXISTS server_ownership_snapshots (
      engine_id UUID PRIMARY KEY REFERENCES engines(engine_id) ON DELETE CASCADE,
      discord_owner_user_id TEXT NOT NULL,
      observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
};

exports.down = async function () {
  // Core identity tables are never dropped automatically
};
