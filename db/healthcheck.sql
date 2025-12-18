SELECT
  (SELECT COUNT(*) FROM engines) AS engines,
  (SELECT COUNT(*) FROM users) AS users,
  (SELECT COUNT(*) FROM scenes) AS scenes;
