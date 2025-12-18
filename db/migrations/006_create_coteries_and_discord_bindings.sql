BEGIN;

-- COTERIES
CREATE TABLE coteries (
  coterie_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  visibility coterie_visibility NOT NULL,
  status coterie_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coteries_engine ON coteries(engine_id);
CREATE INDEX idx_coteries_status ON coteries(status);

-- COTERIE MEMBERSHIPS
CREATE TABLE coterie_memberships (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  coterie_id UUID REFERENCES coteries(coterie_id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(character_id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('leader', 'officer', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  PRIMARY KEY (coterie_id, character_id)
);

CREATE INDEX idx_coterie_members_engine ON coterie_memberships(engine_id);
CREATE INDEX idx_coterie_members_active ON coterie_memberships(coterie_id) WHERE left_at IS NULL;

-- DISCORD BINDINGS (ROLES, CATEGORIES, CHANNELS)
CREATE TABLE discord_bindings (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('coterie')),
  entity_id UUID NOT NULL,
  discord_role_id TEXT,
  discord_category_id TEXT,
  ic_channel_id TEXT,
  ooc_channel_id TEXT,
  archived_at TIMESTAMPTZ,
  PRIMARY KEY (engine_id, entity_type, entity_id)
);

COMMIT;
