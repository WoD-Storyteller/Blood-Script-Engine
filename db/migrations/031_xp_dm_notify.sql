BEGIN;

ALTER TABLE xp_ledger
  ADD COLUMN IF NOT EXISTS discord_notified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discord_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS xp_ledger_notify_idx
  ON xp_ledger(engine_id)
  WHERE type='spend'
    AND approved=true
    AND applied=true
    AND discord_notified=false;

COMMIT;