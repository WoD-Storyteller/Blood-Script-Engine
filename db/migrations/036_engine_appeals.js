exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE IF NOT EXISTS engine_appeals (\n  appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  engine_id UUID NOT NULL,\n  submitted_by UUID NOT NULL,\n  message TEXT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  resolved BOOLEAN NOT NULL DEFAULT false,\n  resolved_at TIMESTAMPTZ,\n  resolved_by UUID,\n\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,\n  FOREIGN KEY (submitted_by) REFERENCES users(user_id) ON DELETE SET NULL,\n  FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL\n);\n\nCREATE INDEX IF NOT EXISTS engine_appeals_engine_idx\n  ON engine_appeals(engine_id);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
