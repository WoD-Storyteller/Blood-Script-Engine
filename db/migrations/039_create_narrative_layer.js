exports.up = async function (knex) {
  await knex.raw(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS global_feature_flags (
      feature_key TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS narrative_networks (
      network_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_by_engine_id UUID REFERENCES engines(engine_id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS narrative_network_memberships (
      network_id UUID REFERENCES narrative_networks(network_id) ON DELETE CASCADE,
      engine_id UUID REFERENCES engines(engine_id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      left_at TIMESTAMPTZ,
      PRIMARY KEY (network_id, engine_id)
    );

    CREATE INDEX IF NOT EXISTS idx_narrative_members_engine
      ON narrative_network_memberships(engine_id)
      WHERE left_at IS NULL;

    CREATE TABLE IF NOT EXISTS narrative_events (
      event_id UUID PRIMARY KEY,
      network_id UUID REFERENCES narrative_networks(network_id) ON DELETE CASCADE,
      source_engine_id UUID REFERENCES engines(engine_id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_narrative_events_network ON narrative_events(network_id);
    CREATE INDEX IF NOT EXISTS idx_narrative_events_source ON narrative_events(source_engine_id);

    COMMIT;
  `);
};

exports.down = async function () {
  // no automatic rollback
};
