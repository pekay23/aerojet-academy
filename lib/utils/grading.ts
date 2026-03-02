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
