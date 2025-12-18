BEGIN;

INSERT INTO clans (clan_name)
VALUES
  ('Brujah'),
  ('Gangrel'),
  ('Malkavian'),
  ('Nosferatu'),
  ('Toreador'),
  ('Ventrue'),
  ('Banu Haqim'),
  ('Hecata'),
  ('Lasombra'),
  ('Ministry'),
  ('Ravnos'),
  ('Salubri'),
  ('Tzimisce'),
  ('Thin-Blood')
ON CONFLICT DO NOTHING;

COMMIT;
