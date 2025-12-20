BEGIN;

-- Helpful index for fast strike counts
CREATE INDEX IF NOT EXISTS engine_strikes_engine_created_idx
  ON engine_strikes(engine_id, created_at);

COMMIT;