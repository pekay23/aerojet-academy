import { ACADEMIC_RULES } from '@/lib/constants/business-rules'

const EASA_PASSING_GRADE = ACADEMIC_RULES.EASA_PASS_MARK

/**
 * Calculates an EASA-compliant result grade.
 * ≥EASA_PASS_MARK% = 'P' (Pass), <EASA_PASS_MARK% = 'F'.
 * Note: Legacy records may still carry A/B/C — the UI maps all of those to "Pass".
 */
export function calculateLetterGrade(percentage: number): string {
  return percentage >= EASA_PASSING_GRADE ? 'P' : 'F'
}

/**
 * Checks if a percentage meets the passing threshold.
 */
export function isPassing(percentage: number): boolean {
  return percentage >= EASA_PASSING_GRADE
}

/**
 * Evaluate a combined MCQ + Essay exam result.
 * Both components must meet the EASA passing grade to pass overall.
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
