exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE IF NOT EXISTS safety_threshold_alerts (\n  engine_id UUID NOT NULL,\n  threshold TEXT NOT NULL,\n  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (engine_id, threshold),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
