BEGIN;

-- Holdings owned by coteries (fronts, rackets, havens, influence assets)
CREATE TABLE coterie_holdings (
  holding_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  coterie_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'holding',
  name TEXT NOT NULL,
  income INTEGER NOT NULL DEFAULT 0, -- abstract income
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE INDEX coterie_holdings_engine_coterie_idx ON coterie_holdings(engine_id, coterie_id);

-- Domain tax rules (domain -> coterie, fixed amount per collection)
CREATE TABLE domain_tax_rules (
  rule_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  domain_name TEXT NOT NULL,
  taxed_to_coterie_id UUID NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT 'Domain Tax',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engine_id, domain_name),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE INDEX domain_tax_rules_engine_idx ON domain_tax_rules(engine_id);

-- Boon enforcement (deadlines + escalation)
CREATE TABLE boon_enforcements (
  enforcement_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  boon_id UUID NOT NULL,
  created_by_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','escalated','cancelled')),
  due_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (boon_id) REFERENCES boons(boon_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX boon_enforcements_engine_status_idx ON boon_enforcements(engine_id, status);

COMMIT;