BEGIN;

CREATE TABLE IF NOT EXISTS safety_threshold_alerts (
  engine_id UUID NOT NULL,
  threshold TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, threshold),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

COMMIT;