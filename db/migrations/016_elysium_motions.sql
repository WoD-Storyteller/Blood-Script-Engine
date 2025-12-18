BEGIN;

CREATE TABLE motions (
  motion_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  created_by_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('passed','failed','tied','no_quorum','unknown')),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX motions_engine_status_idx ON motions(engine_id, status);

CREATE TABLE motion_votes (
  vote_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  motion_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes','no','abstain')),
  cast_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engine_id, motion_id, user_id),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (motion_id) REFERENCES motions(motion_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX motion_votes_engine_motion_idx ON motion_votes(engine_id, motion_id);

COMMIT;