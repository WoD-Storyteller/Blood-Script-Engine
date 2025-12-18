BEGIN;

CREATE TABLE engine_night_state (
  engine_id UUID PRIMARY KEY,
  last_processed_date DATE,
  last_processed_at TIMESTAMPTZ,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE TABLE political_pressure (
  pressure_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  source TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE INDEX political_pressure_engine_idx ON political_pressure(engine_id, resolved);

COMMIT;