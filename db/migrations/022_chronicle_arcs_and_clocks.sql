BEGIN;

CREATE TABLE chronicle_arcs (
  arc_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  title TEXT NOT NULL,
  synopsis TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','active','completed','cancelled')),
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  outcome TEXT,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX chronicle_arcs_engine_status_idx ON chronicle_arcs(engine_id, status);

CREATE TABLE story_clocks (
  clock_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  segments INTEGER NOT NULL CHECK (segments > 0),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','paused','cancelled')),
  scope TEXT NOT NULL DEFAULT 'engine'
    CHECK (scope IN ('engine','domain','coterie','scene')),
  scope_key TEXT,
  nightly BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX story_clocks_engine_status_idx ON story_clocks(engine_id, status);
CREATE INDEX story_clocks_engine_nightly_idx ON story_clocks(engine_id, nightly) WHERE nightly = true;

CREATE TABLE clock_ticks (
  tick_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  clock_id UUID NOT NULL,
  ticked_by_user_id UUID,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (clock_id) REFERENCES story_clocks(clock_id) ON DELETE CASCADE,
  FOREIGN KEY (ticked_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX clock_ticks_engine_clock_idx ON clock_ticks(engine_id, clock_id);

-- Optional linking: when clock completes, it can affect an arc (just metadata + ST visible).
CREATE TABLE arc_clock_links (
  link_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  arc_id UUID NOT NULL,
  clock_id UUID NOT NULL,
  on_complete TEXT NOT NULL DEFAULT 'notify',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (arc_id) REFERENCES chronicle_arcs(arc_id) ON DELETE CASCADE,
  FOREIGN KEY (clock_id) REFERENCES story_clocks(clock_id) ON DELETE CASCADE,
  UNIQUE (engine_id, arc_id, clock_id)
);

COMMIT;