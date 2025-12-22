exports.up = async function (knex) {
  await knex.raw(`
    DO $$
    BEGIN
      -- Engine lifecycle
      CREATE TYPE engine_status AS ENUM ('active', 'paused', 'archived');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
    BEGIN
      -- Scene lifecycle
      CREATE TYPE scene_state AS ENUM ('active', 'archived');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
    BEGIN
      -- Boons
      CREATE TYPE boon_status AS ENUM ('active', 'called_in', 'settled', 'void');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
    BEGIN
      -- Canon / lore
      CREATE TYPE canon_status AS ENUM ('canonical', 'provisional', 'apocryphal');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
    BEGIN
      -- Safety cards
      CREATE TYPE safety_card_type AS ENUM ('green', 'yellow', 'red');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE safety_card_status AS ENUM ('active', 'resolved');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
    BEGIN
      -- Engine roles
      CREATE TYPE engine_role AS ENUM ('owner', 'st', 'moderator', 'player');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
    BEGIN
      -- Bans
      CREATE TYPE engine_ban_status AS ENUM ('active', 'appealed', 'revoked');
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
    BEGIN
      -- Strikes
      CREATE TYPE engine_strike_reason AS ENUM (
        'safety_violation',
        'harassment',
        'tenet_violation',
        'admin_action'
      );
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;

    DO $$
BEGIN
  CREATE TYPE role_source AS ENUM (
    'assigned',
    'inherited',
    'system'
  );
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

  `);
};

exports.down = async function () {
  // Intentionally empty.
  // Enum drops are unsafe in production and should never be automatic.
};
