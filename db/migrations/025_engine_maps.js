exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\nALTER TABLE engines\nADD COLUMN google_my_maps_url TEXT;\n\nCOMMIT;");
};

exports.down = async function () {
  // no automatic rollback
};
