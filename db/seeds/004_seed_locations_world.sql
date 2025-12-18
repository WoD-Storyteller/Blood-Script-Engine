BEGIN;

INSERT INTO locations (
  location_id,
  engine_id,
  name,
  type,
  canon
)
SELECT
  gen_random_uuid(),
  e.engine_id,
  'World',
  'world',
  'seed'
FROM engines e
ON CONFLICT DO NOTHING;

COMMIT;
