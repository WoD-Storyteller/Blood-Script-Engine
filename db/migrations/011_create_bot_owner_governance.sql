BEGIN;

-- ENGINE COMPLIANCE / ENFORCEMENT STATUS
CREATE TABLE engine_compliance_status (
  engine_id UUID PRIMARY KEY REFERENCES engines(engine_id) ON DELETE CASCADE,
  strike_count INTEGER NOT NULL DEFAULT 0 CHECK (strike_count BETWEEN 0 AND 3),
  probation BOOLEAN NOT NULL DEFAULT false,
  disabled BOOLEAN NOT NULL DEFAULT false,
  last_reviewed_at TIMESTAMPTZ,
  notes TEXT
);

-- STRIKES (3-STRIKE SYSTEM)
CREATE TABLE strikes (
  strike_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 3),
  category strike_category NOT NULL,
  summary TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_strikes_engine ON strikes(engine_id);
CREATE INDEX idx_strikes_number ON strikes(number);

-- BOT OWNER AUDIT LOG (IMMUTABLE)
CREATE TABLE owner_audit_log (
  audit_id UUID PRIMARY KEY,
  engine_id UUID,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_owner_audit_engine ON owner_audit_log(engine_id);
CREATE INDEX idx_owner_audit_action ON owner_audit_log(action_type);

COMMIT;
