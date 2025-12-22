exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE masquerade_breaches (\n  breach_id UUID PRIMARY KEY,\n  engine_id UUID NOT NULL,\n  user_id UUID,\n  scene_id UUID,\n  severity INTEGER NOT NULL DEFAULT 1,\n  description TEXT NOT NULL,\n  resolved BOOLEAN NOT NULL DEFAULT false,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCREATE TABLE inquisition_heat (\n  engine_id UUID PRIMARY KEY,\n  heat INTEGER NOT NULL DEFAULT 0,\n  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCREATE TABLE inquisition_events (\n  event_id UUID PRIMARY KEY,\n  engine_id UUID NOT NULL,\n  level INTEGER NOT NULL,\n  description TEXT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  resolved BOOLEAN NOT NULL DEFAULT false,\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
