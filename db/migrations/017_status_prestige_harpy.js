exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE status_scores (\n  engine_id UUID NOT NULL,\n  user_id UUID NOT NULL,\n  score INTEGER NOT NULL DEFAULT 0,\n  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (engine_id, user_id),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,\n  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE\n);\n\nCREATE TABLE status_events (\n  event_id UUID PRIMARY KEY,\n  engine_id UUID NOT NULL,\n  target_user_id UUID NOT NULL,\n  changed_by_user_id UUID NOT NULL,\n  delta INTEGER NOT NULL,\n  reason TEXT NOT NULL,\n  authority TEXT NOT NULL DEFAULT 'system' CHECK (authority IN ('st','harpy','system')),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,\n  FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE CASCADE,\n  FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE\n);\n\nCREATE INDEX status_events_engine_target_idx ON status_events(engine_id, target_user_id);\nCREATE INDEX status_scores_engine_score_idx ON status_scores(engine_id, score DESC);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
