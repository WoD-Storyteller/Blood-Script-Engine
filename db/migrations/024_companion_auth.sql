BEGIN;

CREATE TABLE companion_sessions (
  session_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  engine_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('player','st','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE INDEX companion_sessions_user_idx ON companion_sessions(user_id);
CREATE INDEX companion_sessions_engine_idx ON companion_sessions(engine_id);

COMMIT;