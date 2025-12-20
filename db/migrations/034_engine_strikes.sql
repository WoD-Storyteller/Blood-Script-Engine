BEGIN;

CREATE TABLE IF NOT EXISTS engine_strikes (
  strike_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id UUID NOT NULL,
  issued_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS engine_strikes_engine_idx
  ON engine_strikes(engine_id);

COMMIT;