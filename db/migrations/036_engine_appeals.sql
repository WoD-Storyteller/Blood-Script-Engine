BEGIN;

CREATE TABLE IF NOT EXISTS engine_appeals (
  appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id UUID NOT NULL,
  submitted_by UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,

  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS engine_appeals_engine_idx
  ON engine_appeals(engine_id);

COMMIT;