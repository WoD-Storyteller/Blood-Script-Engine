BEGIN;

-- Example default tenets (admins may delete/edit)
INSERT INTO server_tenets (
  tenet_id,
  engine_id,
  title,
  type,
  enabled,
  version
)
SELECT
  gen_random_uuid(),
  e.engine_id,
  t.title,
  'absolute',
  true,
  1
FROM engines e
CROSS JOIN (
  VALUES
    ('No children'),
    ('No sexual violence'),
    ('Fade to black for intimacy'),
    ('No real-world hate speech')
) AS t(title)
ON CONFLICT DO NOTHING;

COMMIT;
