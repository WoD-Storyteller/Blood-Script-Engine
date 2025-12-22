exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE IF NOT EXISTS engine_strikes (\n  strike_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  engine_id UUID NOT NULL,\n  issued_by UUID NOT NULL,\n  reason TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,\n  FOREIGN KEY (issued_by) REFERENCES users(user_id) ON DELETE SET NULL\n);\n\nCREATE INDEX IF NOT EXISTS engine_strikes_engine_idx\n  ON engine_strikes(engine_id);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
