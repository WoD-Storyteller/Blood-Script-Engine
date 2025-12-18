BEGIN;

CREATE TABLE status_scores (
  engine_id UUID NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, user_id),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE status_events (
  event_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  changed_by_user_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  authority TEXT NOT NULL DEFAULT 'system' CHECK (authority IN ('st','harpy','system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX status_events_engine_target_idx ON status_events(engine_id, target_user_id);
CREATE INDEX status_scores_engine_score_idx ON status_scores(engine_id, score DESC);

COMMIT;