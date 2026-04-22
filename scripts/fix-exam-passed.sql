UPDATE exam_results 
SET passed = true 
WHERE percentage >= 75 AND passed = false;

UPDATE exam_results 
SET passed = false 
WHERE percentage < 75 AND passed = true;

SELECT 
  COUNT(*) FILTER (WHERE passed = true AND percentage >= 75) as correct_pass,
  COUNT(*) FILTER (WHERE passed = false AND percentage < 75) as correct_fail,
  COUNT(*) FILTER (WHERE passed = false AND percentage >= 75) as still_wrong_fail,
  COUNT(*) FILTER (WHERE passed = true AND percentage < 75) as still_wrong_pass
FROM exam_results
WHERE percentage IS NOT NULL;
