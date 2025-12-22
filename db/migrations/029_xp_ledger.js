exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE IF NOT EXISTS xp_ledger (\n  xp_id UUID PRIMARY KEY,\n  engine_id UUID NOT NULL,\n  character_id UUID NOT NULL,\n  user_id UUID NOT NULL,\n  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),\n  amount INTEGER NOT NULL CHECK (amount > 0),\n  reason TEXT,\n  approved BOOLEAN NOT NULL DEFAULT false,\n  approved_by UUID,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX IF NOT EXISTS xp_ledger_character_idx\n  ON xp_ledger(engine_id, character_id);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
