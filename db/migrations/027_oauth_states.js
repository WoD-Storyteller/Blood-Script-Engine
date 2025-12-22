exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE IF NOT EXISTS oauth_states (\n  state_id UUID PRIMARY KEY,\n  state TEXT NOT NULL,\n  engine_id UUID NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX IF NOT EXISTS oauth_states_state_idx ON oauth_states(state);\nCREATE INDEX IF NOT EXISTS oauth_states_engine_idx ON oauth_states(engine_id);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
