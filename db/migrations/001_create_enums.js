exports.up = async function (knex) {
  await knex.raw(`
    -- Engine lifecycle
    CREATE TYPE engine_status AS ENUM (
      'active',
      'paused',
      'archived'
    );

    -- Scene lifecycle
    CREATE TYPE scene_state AS ENUM (
      'active',
      'archived'
    );

    -- Boons
    CREATE TYPE boon_status AS ENUM (
      'active',
      'called_in',
      'settled',
      'void'
    );

    -- Canon / lore status
    CREATE TYPE canon_status AS ENUM (
      'canonical',
      'provisional',
      'apocryphal'
    );

    -- Safety system
    CREATE TYPE safety_card_type AS ENUM (
      'green',
      'yellow',
      'red'
    );

    CREATE TYPE safety_card_status AS ENUM (
      'active',
      'resolved'
    );

    -- Engine governance
    CREATE TYPE engine_role AS ENUM (
      'owner',
      'st',
      'moderator',
      'player'
    );

    CREATE TYPE engine_ban_status AS ENUM (
      'active',
      'appealed',
      'revoked'
    );

    CREATE TYPE engine_strike_reason AS ENUM (
      'safety_violation',
      'harassment',
      'tenet_violation',
      'admin_action'
    );
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    DROP TYPE IF EXISTS engine_strike_reason;
    DROP TYPE IF EXISTS engine_ban_status;
    DROP TYPE IF EXISTS engine_role;
    DROP TYPE IF EXISTS safety_card_status;
    DROP TYPE IF EXISTS safety_card_type;
    DROP TYPE IF EXISTS canon_status;
    DROP TYPE IF EXISTS boon_status;
    DROP TYPE IF EXISTS scene_state;
    DROP TYPE IF EXISTS engine_status;
  `);
};
