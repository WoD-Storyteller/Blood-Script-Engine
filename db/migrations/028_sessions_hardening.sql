BEGIN;

-- Companion sessions hardening
ALTER TABLE companion_sessions
  ADD COLUMN IF NOT EXISTS revoked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS csrf_token TEXT;

CREATE INDEX IF NOT EXISTS companion_sessions_active_idx
  ON companion_sessions(engine_id, user_id)
  WHERE revoked = false;

COMMIT;