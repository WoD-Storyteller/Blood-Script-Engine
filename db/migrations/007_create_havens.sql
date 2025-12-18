BEGIN;

-- HAVENS (PERSONAL OR COTERIE)
CREATE TABLE havens (
  haven_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('character', 'coterie')),
  owner_id UUID NOT NULL,
  location_id UUID REFERENCES locations(location_id),
  name TEXT NOT NULL,
  haven_type TEXT NOT NULL, -- apartment, estate, sewer, mobile, etc.
  security_level TEXT NOT NULL, -- abstracted state
  secrecy_level TEXT NOT NULL,
  comfort_level TEXT NOT NULL,
  political_exposure TEXT NOT NULL,
  si_exposure TEXT NOT NULL,
  occult_resonance TEXT,
  tags JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('secure', 'watched', 'compromised', 'lost', 'destroyed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_havens_engine ON havens(engine_id);
CREATE INDEX idx_havens_owner ON havens(owner_type, owner_id);
CREATE INDEX idx_havens_location ON havens(location_id);

-- HAVEN UPGRADES / CHANGES
CREATE TABLE haven_upgrades (
  upgrade_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  haven_id UUID REFERENCES havens(haven_id) ON DELETE CASCADE,
  upgrade_type TEXT NOT NULL,
  description TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HAVEN EVENTS (THREATS, RAIDS, DISCOVERIES)
CREATE TABLE haven_events (
  event_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  haven_id UUID REFERENCES havens(haven_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HAVEN EXPOSURE TRACKING
CREATE TABLE haven_exposure (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  haven_id UUID REFERENCES havens(haven_id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- SI, politics, occult, rumor
  level TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, haven_id, source)
);

COMMIT;
