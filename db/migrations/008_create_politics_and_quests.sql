BEGIN;

-- BOONS (PRESTATION)
CREATE TABLE boons (
  boon_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  type boon_type NOT NULL,
  creditor_type TEXT NOT NULL CHECK (creditor_type IN ('character', 'coterie', 'npc', 'faction')),
  creditor_id UUID NOT NULL,
  debtor_type TEXT NOT NULL CHECK (debtor_type IN ('character', 'coterie', 'npc', 'faction')),
  debtor_id UUID NOT NULL,
  status boon_status NOT NULL DEFAULT 'owed',
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'secret')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_boons_engine ON boons(engine_id);
CREATE INDEX idx_boons_creditor ON boons(creditor_type, creditor_id);
CREATE INDEX idx_boons_debtor ON boons(debtor_type, debtor_id);
CREATE INDEX idx_boons_status ON boons(status);

-- QUESTS
CREATE TABLE quests (
  quest_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('character', 'coterie')),
  owner_id UUID NOT NULL,
  type TEXT NOT NULL,
  status quest_status NOT NULL DEFAULT 'active',
  stakes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quests_engine ON quests(engine_id);
CREATE INDEX idx_quests_scope_owner ON quests(scope, owner_id);
CREATE INDEX idx_quests_status ON quests(status);

-- TITLES / OFFICES (POLITICAL POSITIONS)
CREATE TABLE status_titles (
  title_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_authority TEXT,
  jurisdiction_location_id UUID REFERENCES locations(location_id),
  powers JSONB NOT NULL DEFAULT '{}',
  duties JSONB NOT NULL DEFAULT '{}',
  risks JSONB NOT NULL DEFAULT '{}',
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'whispered', 'secret')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_titles_engine ON status_titles(engine_id);
CREATE INDEX idx_titles_location ON status_titles(jurisdiction_location_id);

-- TITLE ASSIGNMENTS
CREATE TABLE title_assignments (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  assignment_id UUID PRIMARY KEY,
  title_id UUID REFERENCES status_titles(title_id) ON DELETE CASCADE,
  holder_type TEXT NOT NULL CHECK (holder_type IN ('character', 'npc')),
  holder_id UUID NOT NULL,
  granted_by TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_title_assignments_engine ON title_assignments(engine_id);
CREATE INDEX idx_title_assignments_title ON title_assignments(title_id);
CREATE INDEX idx_title_assignments_holder ON title_assignments(holder_type, holder_id) WHERE active = true;

-- POLITICAL ACTIONS (SCHEMES, PETITIONS, UNDERMINING)
CREATE TABLE political_actions (
  action_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('character', 'coterie', 'npc', 'faction')),
  actor_id UUID NOT NULL,
  target_type TEXT CHECK (target_type IN ('character', 'coterie', 'npc', 'faction', 'location')),
  target_id UUID,
  action_type TEXT NOT NULL,
  intent TEXT,
  state TEXT NOT NULL CHECK (state IN ('declared', 'in_progress', 'resolved', 'failed')),
  scene_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_political_actions_engine ON political_actions(engine_id);
CREATE INDEX idx_political_actions_actor ON political_actions(actor_type, actor_id);
CREATE INDEX idx_political_actions_state ON political_actions(state);

COMMIT;
