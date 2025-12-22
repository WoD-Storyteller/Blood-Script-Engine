exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nALTER TABLE engine_appeals\nADD COLUMN IF NOT EXISTS resolution_reason TEXT,\nADD COLUMN IF NOT EXISTS owner_notes TEXT;\n\nCOMMIT;\n");
};

exports.down = async function () {
  // no automatic rollback
};
