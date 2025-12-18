BEGIN;

CREATE TABLE masquerade_breaches (
  breach_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  user_id UUID,
  scene_id UUID,
  severity INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE TABLE inquisition_heat (
  engine_id UUID PRIMARY KEY,
  heat INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE TABLE inquisition_events (
  event_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  level INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

COMMIT;