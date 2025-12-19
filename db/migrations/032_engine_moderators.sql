BEGIN;

CREATE TABLE IF NOT EXISTS engine_moderators (
  engine_id UUID NOT NULL,
  user_id UUID NOT NULL,
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, user_id),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS engine_moderators_engine_idx
  ON engine_moderators(engine_id);

COMMIT;