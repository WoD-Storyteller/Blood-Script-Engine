exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nCREATE TABLE active_characters (\n  engine_id UUID NOT NULL,\n  channel_id TEXT NOT NULL,\n  user_id UUID NOT NULL,\n  character_id UUID NOT NULL,\n  set_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  PRIMARY KEY (engine_id, channel_id, user_id),\n  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,\n  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,\n  FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE\n);\n\nCOMMIT;\n");
};

exports.down = async function () {
  // no automatic rollback
};
