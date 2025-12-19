BEGIN;

CREATE TABLE IF NOT EXISTS oauth_states (
  state_id UUID PRIMARY KEY,
  state TEXT NOT NULL,
  engine_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON oauth_states(state);
CREATE INDEX IF NOT EXISTS oauth_states_engine_idx ON oauth_states(engine_id);

COMMIT;