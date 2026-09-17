CREATE OR REPLACE FUNCTION prevent_published_result_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_published = true THEN
    RAISE EXCEPTION 'Cannot modify a published exam result';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_result_immutability
BEFORE UPDATE ON internal_exam_sessions
FOR EACH ROW
EXECUTE FUNCTION prevent_published_result_modification();
