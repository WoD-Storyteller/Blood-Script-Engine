exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nALTER TABLE xp_ledger\n  ADD COLUMN IF NOT EXISTS discord_notified BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN IF NOT EXISTS discord_notified_at TIMESTAMPTZ;\n\nCREATE INDEX IF NOT EXISTS xp_ledger_notify_idx\n  ON xp_ledger(engine_id)\n  WHERE type='spend'\n    AND approved=true\n    AND applied=true\n    AND discord_notified=false;\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
