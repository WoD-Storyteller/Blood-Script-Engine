BEGIN;

-- Tracks ongoing damage without altering core characters table
CREATE TABLE character_trackers (
  engine_id UUID NOT NULL,
  character_id UUID NOT NULL,
  health_superficial INTEGER NOT NULL DEFAULT 0,
  health_aggravated INTEGER NOT NULL DEFAULT 0,
  willpower_superficial INTEGER NOT NULL DEFAULT 0,
  willpower_aggravated INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, character_id),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE
);

-- Conditions (generic, IP-safe)
CREATE TABLE character_conditions (
  condition_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  character_id UUID NOT NULL,
  name TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'minor',
  source TEXT,
  scene_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE
);

-- Combat log for audit/debug
CREATE TABLE combat_log (
  log_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  scene_id UUID NOT NULL,
  attacker_character_id UUID,
  defender_character_id UUID,
  damage INTEGER NOT NULL DEFAULT 0,
  damage_type TEXT NOT NULL DEFAULT 'superficial',
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

COMMIT;
