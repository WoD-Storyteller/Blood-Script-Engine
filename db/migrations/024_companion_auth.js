exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE companion_sessions (\n  session_id UUID PRIMARY KEY,\n  user_id UUID NOT NULL,\n  engine_id UUID NOT NULL,\n  access_token TEXT NOT NULL,\n  role TEXT NOT NULL CHECK (role IN ('player','st','admin')),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  expires_at TIMESTAMPTZ NOT NULL,\n  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCREATE INDEX companion_sessions_user_idx ON companion_sessions(user_id);\nCREATE INDEX companion_sessions_engine_idx ON companion_sessions(engine_id);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
