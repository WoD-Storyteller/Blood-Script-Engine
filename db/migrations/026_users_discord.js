exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nALTER TABLE users\n  ADD COLUMN IF NOT EXISTS discord_user_id TEXT;\n\nCREATE UNIQUE INDEX IF NOT EXISTS users_discord_user_id_uq\n  ON users(discord_user_id)\n  WHERE discord_user_id IS NOT NULL;\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
