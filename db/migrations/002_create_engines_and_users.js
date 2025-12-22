exports.up = async function (knex) {
  await knex.raw(`
    -- Enable UUID generation (safe if already enabled)
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Engines (one per Discord server)
    CREATE TABLE engines (
      engine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      discord_guild_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status engine_status NOT NULL DEFAULT 'active',
      seed_chronicle_id UUID,
      config JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Users (global, across engines)
    CREATE TABLE users (
      user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      discord_user_id TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Engine memberships (roles per engine)
    CREATE TABLE engine_memberships (
      engine_id UUID NOT NULL REFERENCES engines(engine_id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      role engine_role NOT NULL DEFAULT 'player',
      role_source TEXT NOT NULL DEFAULT 'assigned',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (engine_id, user_id)
    );
  `);
};

exports.down = async function () {
  // Never drop core identity tables automatically
};
