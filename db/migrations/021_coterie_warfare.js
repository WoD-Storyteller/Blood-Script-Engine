exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE coterie_conflicts (\n  conflict_id UUID PRIMARY KEY,\n  engine_id UUID NOT NULL,\n  attacker_coterie_id UUID NOT NULL,\n  defender_coterie_id UUID NOT NULL,\n  territory TEXT NOT NULL,\n  intensity INTEGER NOT NULL DEFAULT 1,\n  status TEXT NOT NULL DEFAULT 'active'\n    CHECK (status IN ('active','paused','resolved')),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCREATE TABLE conflict_actions (\n  action_id UUID PRIMARY KEY,\n  conflict_id UUID NOT NULL,\n  coterie_id UUID NOT NULL,\n  kind TEXT NOT NULL CHECK (kind IN ('attack','defend','sabotage','withdraw')),\n  description TEXT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  FOREIGN KEY (conflict_id) REFERENCES coterie_conflicts(conflict_id) ON DELETE CASCADE\n);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
