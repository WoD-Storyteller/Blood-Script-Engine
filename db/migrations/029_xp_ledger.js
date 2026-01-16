exports.up = async function (knex) {
  await knex.raw(`BEGIN;

-- Add type column if it doesn't exist
ALTER TABLE xp_ledger
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update existing records if type is null
UPDATE xp_ledger SET type = 'earn' WHERE type IS NULL;

-- Add check constraint only if records are valid
DO $$
BEGIN
  ALTER TABLE xp_ledger ADD CONSTRAINT xp_type_check CHECK (type IN ('earn', 'spend'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS xp_ledger_character_idx
  ON xp_ledger(engine_id, character_id);

COMMIT;`);
};

exports.down = async function () {
  // no automatic rollback
};
