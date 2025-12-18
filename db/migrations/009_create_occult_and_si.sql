BEGIN;

-- RITUALS (ABSTRACT MECHANICAL RECORDS, NO RULEBOOK PROSE)
CREATE TABLE rituals (
  ritual_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  tradition TEXT NOT NULL CHECK (tradition IN ('blood_sorcery', 'oblivion', 'cult', 'hedge')),
  name TEXT NOT NULL,
  risk_tier INTEGER NOT NULL CHECK (risk_tier BETWEEN 0 AND 5),
  requirements JSONB NOT NULL DEFAULT '{}',
  known_effects JSONB NOT NULL DEFAULT '{}',
  hidden_costs JSONB NOT NULL DEFAULT '{}',
  canon canon_status NOT NULL DEFAULT 'provisional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rituals_engine ON rituals(engine_id);
CREATE INDEX idx_rituals_tradition ON rituals(tradition);

-- OCCULT DISTURBANCE EVENTS
CREATE TABLE occult_disturbance (
  event_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(location_id),
  source_type TEXT NOT NULL, -- ritual, cult, anomaly
  source_id UUID,
  severity TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_occult_engine ON occult_disturbance(engine_id);
CREATE INDEX idx_occult_location ON occult_disturbance(location_id);

-- SI CELLS
CREATE TABLE si_cells (
  cell_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jurisdiction_location_id UUID REFERENCES locations(location_id),
  mandate TEXT,
  capabilities JSONB NOT NULL DEFAULT '{}',
  tactics JSONB NOT NULL DEFAULT '{}',
  escalation_doctrine JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_si_cells_engine ON si_cells(engine_id);
CREATE INDEX idx_si_cells_jurisdiction ON si_cells(jurisdiction_location_id);

-- SI ATTENTION (PHASED ESCALATION BY LOCATION)
CREATE TABLE si_attention (
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(location_id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 6),
  last_update_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, location_id)
);

-- SI OPERATIONS (RAIDS, SURVEILLANCE, STINGS)
CREATE TABLE si_operations (
  operation_id UUID PRIMARY KEY,
  engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
  cell_id UUID REFERENCES si_cells(cell_id) ON DELETE SET NULL,
  target_location_id UUID REFERENCES locations(location_id),
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'completed', 'aborted')),
  notes TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_si_ops_engine ON si_operations(engine_id);
CREATE INDEX idx_si_ops_status ON si_operations(status);

COMMIT;
