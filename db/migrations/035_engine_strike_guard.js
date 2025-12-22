exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\n-- Helpful index for fast strike counts\nCREATE INDEX IF NOT EXISTS engine_strikes_engine_created_idx\n  ON engine_strikes(engine_id, created_at);\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
