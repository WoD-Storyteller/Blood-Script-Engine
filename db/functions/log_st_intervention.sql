CREATE OR REPLACE FUNCTION log_st_intervention()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO owner_audit_log (
    audit_id,
    engine_id,
    action_type,
    reason,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.engine_id,
    'st_intervention',
    'Manual ST action recorded',
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
