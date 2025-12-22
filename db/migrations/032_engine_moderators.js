exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE IF NOT EXISTS engine_moderators (\n  engine_id UUID NOT NULL,\n  user_id UUID NOT NULL,\n  added_by UUID NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (engine_id, user_id),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,\n  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,\n  FOREIGN KEY (added_by) REFERENCES users(user_id) ON DELETE SET NULL\n);\n\nCREATE INDEX IF NOT EXISTS engine_moderators_engine_idx\n  ON engine_moderators(engine_id);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
