BEGIN;

CREATE TABLE server_tenets (
  tenet_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type tenet_type NOT NULL DEFAULT 'absolute',
  enabled BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE safety_signals (
  signal_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  scene_id UUID,
  signal_type safety_signal_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scene_safety_state (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  scene_id UUID PRIMARY KEY,
  status TEXT NOT NULL,
  last_signal_at TIMESTAMPTZ,
  unresolved_since TIMESTAMPTZ
);

CREATE TABLE tenet_violation_attempts (
  attempt_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  scene_id UUID,
  tenet_id UUID REFERENCES server_tenets(tenet_id),
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE player_tenet_warnings (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, user_id, level)
);

COMMIT;
