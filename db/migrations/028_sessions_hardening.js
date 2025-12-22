exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\n-- Companion sessions hardening\nALTER TABLE companion_sessions\n  ADD COLUMN IF NOT EXISTS revoked BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,\n  ADD COLUMN IF NOT EXISTS csrf_token TEXT;\n\nCREATE INDEX IF NOT EXISTS companion_sessions_active_idx\n  ON companion_sessions(engine_id, user_id)\n  WHERE revoked = false;\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
