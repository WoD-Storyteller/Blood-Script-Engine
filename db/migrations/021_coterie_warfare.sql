BEGIN;

CREATE TABLE coterie_conflicts (
  conflict_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  attacker_coterie_id UUID NOT NULL,
  defender_coterie_id UUID NOT NULL,
  territory TEXT NOT NULL,
  intensity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','paused','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE TABLE conflict_actions (
  action_id UUID PRIMARY KEY,
  conflict_id UUID NOT NULL,
  coterie_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('attack','defend','sabotage','withdraw')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (conflict_id) REFERENCES coterie_conflicts(conflict_id) ON DELETE CASCADE
);

COMMIT;