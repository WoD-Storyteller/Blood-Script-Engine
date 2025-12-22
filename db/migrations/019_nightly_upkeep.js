exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE engine_night_state (\n  engine_id UUID PRIMARY KEY,\n  last_processed_date DATE,\n  last_processed_at TIMESTAMPTZ,\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCREATE TABLE political_pressure (\n  pressure_id UUID PRIMARY KEY,\n  engine_id UUID NOT NULL,\n  source TEXT NOT NULL,\n  severity INTEGER NOT NULL DEFAULT 1,\n  description TEXT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  resolved BOOLEAN NOT NULL DEFAULT false,\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCREATE INDEX political_pressure_engine_idx ON political_pressure(engine_id, resolved);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
