exports.up = async function (knex) {
  await knex.raw(
    "BEGIN;\n\nCREATE TABLE IF NOT EXISTS server_tenets (\n  tenet_id UUID PRIMARY KEY,\n  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,\n  title TEXT NOT NULL,\n  type tenet_type NOT NULL DEFAULT 'absolute',\n  enabled BOOLEAN NOT NULL DEFAULT true,\n  version INTEGER NOT NULL DEFAULT 1,\n  created_by UUID REFERENCES users(user_id),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS safety_signals (\n  signal_id UUID PRIMARY KEY,\n  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,\n  scene_id UUID,\n  signal_type safety_signal_type NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS scene_safety_state (\n  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,\n  scene_id UUID PRIMARY KEY,\n  status TEXT NOT NULL,\n  last_signal_at TIMESTAMPTZ,\n  unresolved_since TIMESTAMPTZ\n);\n\nCREATE TABLE IF NOT EXISTS tenet_violation_attempts (\n  attempt_id UUID PRIMARY KEY,\n  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,\n  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,\n  scene_id UUID,\n  tenet_id UUID REFERENCES server_tenets(tenet_id),\n  category TEXT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS player_tenet_warnings (\n  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,\n  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,\n  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),\n  reason TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (engine_id, user_id, level)\n);\n\nCOMMIT;\n"
  );
};

exports.down = async function () {
  // no automatic rollback
};
