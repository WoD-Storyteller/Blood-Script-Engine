BEGIN;

ALTER TABLE engines
ADD COLUMN google_my_maps_url TEXT;

COMMIT;