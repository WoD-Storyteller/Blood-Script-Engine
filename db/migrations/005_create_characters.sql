BEGIN;

-- CHARACTERS (VTM CORE)
CREATE TABLE characters (
  character_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  clan TEXT NOT NULL,
  is_thin_blood BOOLEAN NOT NULL DEFAULT false,
  blood_potency INTEGER NOT NULL CHECK (blood_potency >= 0),
  humanity INTEGER NOT NULL CHECK (humanity BETWEEN 0 AND 10),
  hunger INTEGER NOT NULL CHECK (hunger BETWEEN 0 AND 5),
  willpower_current INTEGER NOT NULL,
  willpower_max INTEGER NOT NULL,
  ambition TEXT,
  desire TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_characters_engine ON characters(engine_id);
CREATE INDEX idx_characters_user ON characters(user_id);

-- CHARACTER DISCIPLINES
CREATE TABLE character_disciplines (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(character_id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  dots INTEGER NOT NULL CHECK (dots BETWEEN 0 AND 5),
  amalgams JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (character_id, discipline)
);

-- TOUCHSTONES
CREATE TABLE touchstones (
  touchstone_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(character_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('safe', 'threatened', 'lost')),
  visibility TEXT NOT NULL CHECK (visibility IN ('player', 'st')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONVICTIONS
CREATE TABLE convictions (
  conviction_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(character_id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- STAINS LEDGER
CREATE TABLE stains_ledger (
  entry_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(character_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  scene_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XP LEDGER
CREATE TABLE xp_ledger (
  entry_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(character_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_by TEXT NOT NULL CHECK (created_by IN ('st_core', 'st_user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
