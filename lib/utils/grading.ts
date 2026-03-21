export const EASA_PASSING_GRADE = 75

/**
 * Calculates a letter grade based on a percentage.
 */
export function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= EASA_PASSING_GRADE) return 'C'
  return 'F'
}

/**
 * Checks if a percentage meets the passing threshold.
 */
export function isPassing(percentage: number): boolean {
  return percentage >= EASA_PASSING_GRADE
}

/**
 * Evaluate a combined MCQ + Essay exam result.
 * Both components must meet the EASA passing grade (75%) to pass overall.
 * If either fails, the entire combined exam requires a resit.
 */
export function evaluateCombinedExamResult(mcqPercentage: number, essayPercentage: number) {
  const mcqPassed = mcqPercentage >= EASA_PASSING_GRADE
  const essayPassed = essayPercentage >= EASA_PASSING_GRADE
  return {
    passed: mcqPassed && essayPassed,
    mcqPassed,
    essayPassed,
    mcqPercentage,
    essayPercentage,
    requiresResit: !mcqPassed || !essayPassed,
  }
}
