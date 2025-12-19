BEGIN;

ALTER TABLE xp_ledger
  ADD COLUMN IF NOT EXISTS meta JSONB,
  ADD COLUMN IF NOT EXISTS applied BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS xp_ledger_pending_apply_idx
  ON xp_ledger(engine_id)
  WHERE type='spend' AND approved=true AND applied=false;

COMMIT;