BEGIN;

CREATE TYPE boon_type AS ENUM (
  'trivial',
  'minor',
  'major',
  'life'
);

CREATE TABLE boons (
  boon_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  creditor_character_id UUID NOT NULL,
  debtor_character_id UUID NOT NULL,
  boon_type boon_type NOT NULL,
  reason TEXT NOT NULL,
  called_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE TABLE political_status (
  engine_id UUID NOT NULL,
  character_id UUID NOT NULL,
  title TEXT NOT NULL,
  faction TEXT,
  authority_level INTEGER NOT NULL DEFAULT 1,
  appointed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, character_id),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

COMMIT;
