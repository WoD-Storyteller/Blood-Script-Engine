exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE court_offices (\n  office_id UUID PRIMARY KEY,\n  engine_id UUID NOT NULL,\n  office TEXT NOT NULL,\n  holder_user_id UUID,\n  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','vacant')),\n  notes TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  UNIQUE (engine_id, office),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,\n  FOREIGN KEY (holder_user_id) REFERENCES users(user_id) ON DELETE SET NULL\n);\n\nCREATE INDEX court_offices_engine_idx ON court_offices(engine_id);\n\nCOMMIT;\n");
};

exports.down = async function () {
  // no automatic rollback
};
