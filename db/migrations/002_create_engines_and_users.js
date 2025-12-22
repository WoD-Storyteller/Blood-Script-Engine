exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE engines (\n  engine_id UUID PRIMARY KEY,\n  discord_guild_id TEXT NOT NULL UNIQUE,\n  name TEXT NOT NULL,\n  status engine_status NOT NULL DEFAULT 'active',\n  seed_chronicle_id UUID,\n  config JSONB NOT NULL DEFAULT '{}',\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE users (\n  user_id UUID PRIMARY KEY,\n  discord_user_id TEXT NOT NULL UNIQUE,\n  username TEXT NOT NULL,\n  avatar_url TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE engine_memberships (\n  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,\n  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,\n  role engine_role NOT NULL,\n  role_source role_source NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (engine_id, user_id)\n);\n\nCREATE TABLE server_ownership_snapshots (\n  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,\n  discord_owner_user_id TEXT NOT NULL,\n  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (engine_id)\n);\n\nCOMMIT;\n");
};

exports.down = async function () {
  // no automatic rollback
};
