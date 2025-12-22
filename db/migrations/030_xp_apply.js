exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nALTER TABLE xp_ledger\n  ADD COLUMN IF NOT EXISTS meta JSONB,\n  ADD COLUMN IF NOT EXISTS applied BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;\n\nCREATE INDEX IF NOT EXISTS xp_ledger_pending_apply_idx\n  ON xp_ledger(engine_id)\n  WHERE type='spend' AND approved=true AND applied=false;\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
