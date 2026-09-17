-- SECURITY DEFINER grading function for internal exam submissions
-- This function grades exam sessions server-side with correct answers
-- never exposed to the client.
--
-- Uses correct schema:
--   internal_exam_sessions  (not exam_attempts)
--   internal_exam_answers   (not exam_answers)
--   internal_exam_questions  (not exam_questions)
--   internal_exam_rule_overrides (pass_mark_pct)

CREATE OR REPLACE FUNCTION grade_internal_exam_session(p_session_id UUID)
RETURNS TABLE(
  score INT,
  total_points INT,
  percentage NUMERIC,
  passed BOOLEAN
) AS $$
DECLARE
  v_session RECORD;
  v_answer RECORD;
  v_score INT := 0;
  v_total INT := 0;
  v_pass_mark INT := 75;
  v_percentage NUMERIC;
BEGIN
  -- Security: lock down search_path to prevent privilege escalation
  SET search_path = pg_catalog, public;

  -- Lock the session to prevent concurrent grading
  SELECT * INTO v_session
  FROM internal_exam_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  IF v_session.submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Session already graded: %', p_session_id;
  END IF;

  -- Get pass mark from rule overrides, fallback to 75 (EASA default)
  SELECT COALESCE(ro.pass_mark_pct, 75) INTO v_pass_mark
  FROM internal_exam_sessions s
  LEFT JOIN internal_exam_rule_overrides ro ON ro.bank_id = s.bank_id
  WHERE s.id = p_session_id;

  IF v_pass_mark IS NULL THEN
    v_pass_mark := 75;
  END IF;

  -- Grade each answer
  FOR v_answer IN
    SELECT a.*, q.correct_answer, q.points
    FROM internal_exam_answers a
    JOIN internal_exam_questions q ON a.question_id = q.id
    WHERE a.session_id = p_session_id
  LOOP
    v_total := v_total + v_answer.points;

    IF v_answer.selected_answer = v_answer.correct_answer THEN
      v_score := v_score + v_answer.points;
    END IF;
  END LOOP;

  -- Calculate percentage
  IF v_total > 0 THEN
    v_percentage := (v_score::NUMERIC / v_total::NUMERIC) * 100;
  ELSE
    v_percentage := 0;
  END IF;

  -- Update session
  UPDATE internal_exam_sessions
  SET
    score = v_score,
    total_points = v_total,
    percentage = v_percentage,
    passed = v_percentage >= v_pass_mark,
    submitted_at = NOW()
  WHERE id = p_session_id;

  RETURN QUERY SELECT v_score, v_total, v_percentage, v_percentage >= v_pass_mark;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Grant execute to authenticated users (application role)
GRANT EXECUTE ON FUNCTION grade_internal_exam_session(UUID) TO authenticated;

-- Revoke all other privileges
REVOKE ALL ON FUNCTION grade_internal_exam_session(UUID) FROM public;
