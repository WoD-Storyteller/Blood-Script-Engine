exports.up = async function (knex) {
  // This migration is a duplicate of 009_create_occult_and_si.js
  // Tables already created in 009, skipping.
};

exports.down = async function () {
  // no automatic rollback
};
