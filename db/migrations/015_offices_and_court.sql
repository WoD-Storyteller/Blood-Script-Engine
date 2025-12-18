BEGIN;

CREATE TABLE court_offices (
  office_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  office TEXT NOT NULL,
  holder_user_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','vacant')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engine_id, office),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (holder_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX court_offices_engine_idx ON court_offices(engine_id);

COMMIT;
