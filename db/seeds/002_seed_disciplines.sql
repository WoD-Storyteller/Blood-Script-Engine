BEGIN;

INSERT INTO disciplines (discipline_name)
VALUES
  ('Animalism'),
  ('Auspex'),
  ('Blood Sorcery'),
  ('Celerity'),
  ('Dominate'),
  ('Fortitude'),
  ('Oblivion'),
  ('Obfuscate'),
  ('Potence'),
  ('Presence'),
  ('Protean'),
  ('Thin-Blood Alchemy')
ON CONFLICT DO NOTHING;

COMMIT;
