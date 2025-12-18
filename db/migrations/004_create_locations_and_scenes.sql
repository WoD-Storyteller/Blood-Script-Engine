BEGIN;

-- LOCATIONS (GLOBAL → CITY → DISTRICT → SITE / HAVEN)
CREATE TABLE locations (
  location_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- city, district, site, haven, domain, etc.
  parent_location_id UUID REFERENCES locations(location_id),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  tags JSONB NOT NULL DEFAULT '{}',
  canon canon_status NOT NULL DEFAULT 'provisional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_locations_engine ON locations(engine_id);
CREATE INDEX idx_locations_parent ON locations(parent_location_id);

-- SCENES
CREATE TABLE scenes (
  scene_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  category_id TEXT,
  location_id UUID REFERENCES locations(location_id),
  title TEXT,
  state scene_state NOT NULL DEFAULT 'active',
  tone_tags JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scenes_engine ON scenes(engine_id);
CREATE INDEX idx_scenes_location ON scenes(location_id);
CREATE INDEX idx_scenes_state ON scenes(state);

-- SCENE PARTICIPANTS
CREATE TABLE scene_participants (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(scene_id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL, -- character, coterie, npc
  participant_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  PRIMARY KEY (scene_id, participant_id)
);

-- PRESENCE (FOR PRESENCE-GATING)
CREATE TABLE presence (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  character_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'afk', 'offline')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, character_id)
);

COMMIT;
