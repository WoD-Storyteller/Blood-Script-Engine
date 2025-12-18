CREATE TYPE engine_status AS ENUM (
  'active', 'probation', 'disabled', 'maintenance'
);

CREATE TYPE engine_role AS ENUM (
  'player', 'st', 'admin'
);

CREATE TYPE role_source AS ENUM (
  'automatic', 'assigned'
);

CREATE TYPE safety_signal_type AS ENUM (
  'red', 'yellow', 'green'
);

CREATE TYPE scene_state AS ENUM (
  'active', 'paused', 'escalating', 'resolved', 'archived'
);

CREATE TYPE canon_status AS ENUM (
  'seed', 'provisional', 'observed', 'canonized', 'retired'
);

CREATE TYPE coterie_visibility AS ENUM (
  'public', 'private', 'secret'
);

CREATE TYPE coterie_status AS ENUM (
  'active', 'archived', 'dissolved'
);

CREATE TYPE boon_type AS ENUM (
  'trivial', 'minor', 'major', 'life', 'blood'
);

CREATE TYPE boon_status AS ENUM (
  'owed', 'called', 'resolved', 'broken'
);

CREATE TYPE quest_status AS ENUM (
  'dormant', 'active', 'escalating', 'resolved', 'failed'
);

CREATE TYPE tenet_type AS ENUM (
  'absolute', 'advisory'
);

CREATE TYPE strike_category AS ENUM (
  'safety', 'abuse', 'governance'
);
