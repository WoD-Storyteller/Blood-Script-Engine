exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nALTER TABLE engines\nADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false,\nADD COLUMN IF NOT EXISTS banned_reason TEXT,\nADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,\nADD COLUMN IF NOT EXISTS banned_by UUID;\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
