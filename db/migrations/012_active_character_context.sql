BEGIN;

CREATE TABLE active_characters (
  engine_id UUID NOT NULL,
  channel_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  character_id UUID NOT NULL,
  set_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (engine_id, channel_id, user_id),
  FOREIGN KEY (engine_id) REFERENCES engines(engine_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE
);

COMMIT;
