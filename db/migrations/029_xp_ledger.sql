BEGIN;

CREATE TABLE IF NOT EXISTS xp_ledger (
  xp_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  character_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xp_ledger_character_idx
  ON xp_ledger(engine_id, character_id);

COMMIT;