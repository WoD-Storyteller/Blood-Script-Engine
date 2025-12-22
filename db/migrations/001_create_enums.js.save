exports.up = async function (knex) {
  await knex.raw("CREATE TYPE engine_status AS ENUM (\n  'active', 'probation', 'disabled', 'maintenance'\n);\n\nCREATE TYPE engine_role AS ENUM (\n  'player', 'st', 'admin'\n);\n\nCREATE TYPE role_source AS ENUM (\n  'automatic', 'assigned'\n);\n\nCREATE TYPE safety_signal_type AS ENUM (\n  'red', 'yellow', 'green'\n);\n\nCREATE TYPE scene_state AS ENUM (\n  'active', 'paused', 'escalating', 'resolved', 'archived'\n);\n\nCREATE TYPE canon_status AS ENUM (\n  'seed', 'provisional', 'observed', 'canonized', 'retired'\n);\n\nCREATE TYPE coterie_visibility AS ENUM (\n  'public', 'private', 'secret'\n);\n\nCREATE TYPE coterie_status AS ENUM (\n  'active', 'archived', 'dissolved'\n);\n\nCREATE TYPE boon_type AS ENUM (\n  'trivial', 'minor', 'major', 'life', 'blood'\n);\n\nCREATE TYPE boon_status AS ENUM (\n  'owed', 'called', 'resolved', 'broken'\n);\n\nCREATE TYPE quest_status AS ENUM (\n  'dormant', 'active', 'escalating', 'resolved', 'failed'\n);\n\nCREATE TYPE tenet_type AS ENUM (\n  'absolute', 'advisory'\n);\n\nCREATE TYPE strike_category AS ENUM (\n  'safety', 'abuse', 'governance'\n);\n");
};

exports.down = async function () {
  // no automatic rollback
};
