exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nDO $$\nBEGIN\n  CREATE TYPE boon_type AS ENUM (\n    'trivial',\n    'minor',\n    'major',\n    'life'\n  );\nEXCEPTION WHEN duplicate_object THEN\n  NULL;\nEND $$;\n\nCREATE TABLE IF NOT EXISTS boons (\n  boon_id UUID PRIMARY KEY,\n  engine_id UUID NOT NULL,\n  creditor_character_id UUID NOT NULL,\n  debtor_character_id UUID NOT NULL,\n  boon_type boon_type NOT NULL,\n  reason TEXT NOT NULL,\n  called_in BOOLEAN NOT NULL DEFAULT false,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  resolved_at TIMESTAMPTZ,\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCREATE TABLE IF NOT EXISTS political_status (\n  engine_id UUID NOT NULL,\n  character_id UUID NOT NULL,\n  title TEXT NOT NULL,\n  faction TEXT,\n  authority_level INTEGER NOT NULL DEFAULT 1,\n  appointed_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (engine_id, character_id),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE\n);\n\nCOMMIT;\n");
};

exports.down = async function () {
  // no automatic rollback
};
