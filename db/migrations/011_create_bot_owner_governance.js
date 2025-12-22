exports.up = async function (knex) {
  await knex.raw("BEGIN;\n\n-- ENGINE COMPLIANCE / ENFORCEMENT STATUS\nCREATE TABLE engine_compliance_status (\n  engine_id UUID PRIMARY KEY REFERENCES engines(engine_id) ON DELETE CASCADE,\n  strike_count INTEGER NOT NULL DEFAULT 0 CHECK (strike_count BETWEEN 0 AND 3),\n  probation BOOLEAN NOT NULL DEFAULT false,\n  disabled BOOLEAN NOT NULL DEFAULT false,\n  last_reviewed_at TIMESTAMPTZ,\n  notes TEXT\n);\n\n-- STRIKES (3-STRIKE SYSTEM)\nCREATE TABLE strikes (\n  strike_id UUID PRIMARY KEY,\n  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,\n  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 3),\n  category strike_category NOT NULL,\n  summary TEXT NOT NULL,\n  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX idx_strikes_engine ON strikes(engine_id);\nCREATE INDEX idx_strikes_number ON strikes(number);\n\n-- BOT OWNER AUDIT LOG (IMMUTABLE)\nCREATE TABLE owner_audit_log (\n  audit_id UUID PRIMARY KEY,\n  engine_id UUID,\n  action_type TEXT NOT NULL,\n  reason TEXT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\nCREATE INDEX idx_owner_audit_engine ON owner_audit_log(engine_id);\nCREATE INDEX idx_owner_audit_action ON owner_audit_log(action_type);\n\nCOMMIT;\n");
};

exports.down = async function () {
  // no automatic rollback
};
