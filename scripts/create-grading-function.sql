-- SECURITY DEFINER grading function for exam submissions
-- This function grades exam attempts server-side with correct answers
-- never exposed to the client.

CREATE OR REPLACE FUNCTION grade_exam_attempt(p_attempt_id UUID)
RETURNS TABLE(
  score INT,
  total_points INT,
  percentage NUMERIC,
  passed BOOLEAN
) AS $$
DECLARE
  v_attempt RECORD;
  v_answer RECORD;
  v_score INT := 0;
  v_total INT := 0;
  v_pass_mark INT := 75;
BEGIN
  -- Lock the attempt to prevent concurrent grading
  SELECT * INTO v_attempt FROM exam_attempts WHERE id = p_attempt_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found: %', p_attempt_id;
  END IF;

  IF v_attempt.submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Attempt already graded: %', p_attempt_id;
  END IF;

  -- Get pass mark from exam config
  SELECT (config->>'passMark')::INT INTO v_pass_mark
  FROM exams WHERE id = v_attempt.exam_id;

  IF v_pass_mark IS NULL THEN
    v_pass_mark := 75;
  END IF;

  -- Grade each answer
  FOR v_answer IN
    SELECT a.*, q.correct_answer, q.points
    FROM exam_answers a
    JOIN exam_questions q ON a.question_id = q.id
    WHERE a.attempt_id = p_attempt_id
  LOOP
    v_total := v_total + v_answer.points;

    IF v_answer.selected_option = v_answer.correct_answer THEN
      v_score := v_score + v_answer.points;
    END IF;
  END LOOP;

  -- Calculate percentage
  IF v_total > 0 THEN
    v_percentage := (v_score::NUMERIC / v_total::NUMERIC) * 100;
  ELSE
    v_percentage := 0;
  END IF;

  -- Update attempt
  UPDATE exam_attempts
  SET
    score = v_score,
    total_points = v_total,
    percentage = v_percentage,
    passed = v_percentage >= v_pass_mark,
    submitted_at = NOW()
  WHERE id = p_attempt_id;

  RETURN QUERY SELECT v_score, v_total, v_percentage, v_percentage >= v_pass_mark;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (application role)
GRANT EXECUTE ON FUNCTION grade_exam_attempt(UUID) TO authenticated;

-- Revoke all other privileges
REVOKE ALL ON FUNCTION grade_exam_attempt(UUID) FROM public;
