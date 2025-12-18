BEGIN;

CREATE TABLE factions (
  faction_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  name TEXT NOT NULL,
  ideology TEXT,
  disposition JSONB NOT NULL DEFAULT '{}'::jsonb,
  aggression INTEGER NOT NULL DEFAULT 1,
  secrecy INTEGER NOT NULL DEFAULT 1,
  resources INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

CREATE TABLE npcs (
  npc_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  name TEXT NOT NULL,
  faction_id UUID,
  role TEXT,
  personality JSONB NOT NULL DEFAULT '{}'::jsonb,
  ambition TEXT,
  status INTEGER NOT NULL DEFAULT 0,
  alive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (faction_id) REFERENCES factions(faction_id) ON DELETE SET NULL
);

CREATE TABLE ai_intents (
  intent_id UUID PRIMARY KEY,
  engine_id UUID NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('npc','faction')),
  actor_id UUID NOT NULL,
  intent_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','approved','rejected','executed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ,
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE
);

COMMIT;