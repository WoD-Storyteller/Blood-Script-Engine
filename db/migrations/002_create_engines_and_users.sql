BEGIN;

CREATE TABLE engines (
  engine_id UUID PRIMARY KEY,
  discord_guild_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status engine_status NOT NULL DEFAULT 'active',
  seed_chronicle_id UUID,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE engine_memberships (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  role engine_role NOT NULL,
  role_source role_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, user_id)
);

CREATE TABLE server_ownership_snapshots (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  discord_owner_user_id TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id)
);

COMMIT;
