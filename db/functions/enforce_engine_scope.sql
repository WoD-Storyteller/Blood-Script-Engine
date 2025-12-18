CREATE OR REPLACE FUNCTION enforce_engine_scope()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.engine_id IS DISTINCT FROM OLD.engine_id THEN
    RAISE EXCEPTION 'engine_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
