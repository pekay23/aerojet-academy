import { EASA_DEFAULTS } from './engine'

export const INTERNAL_EXAM_TYPES = {
  MIDTERM: 'MIDTERM',
  FINAL: 'FINAL',
  QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT',
} as const

export const INTERNAL_GRADE_THRESHOLDS = {
  PASS: 60,
  DISTINCTION: 90,
} as const

export function validateInternalExamResult(result: { score: number; maxScore: number }): { valid: boolean } {
  return { valid: result.score >= 0 && result.score <= result.maxScore }
}

export function calculateInternalExamGrade(percentage: number): string {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

export function getInternalExamStatus(percentage: number): 'PASSED' | 'FAILED' {
  return percentage >= INTERNAL_GRADE_THRESHOLDS.PASS ? 'PASSED' : 'FAILED'
}

export interface GradableAnswer {
  questionId: string
  correctAnswer: string
  points: number
}

export interface StudentResponse {
  questionId: string
  selectedAnswer: string
}

export interface ScoreResult {
  score: number
  totalPoints: number
  percentage: number
  passed: boolean
}

export function calculateScore(
  responses: StudentResponse[],
  answers: GradableAnswer[],
  passMarkPct: number = EASA_DEFAULTS.passMarkPct,
): ScoreResult {
  let score = 0
  let totalPoints = 0

  for (const ans of answers) {
    const response = responses.find(r => r.questionId === ans.questionId)
    const isCorrect = response?.selectedAnswer === ans.correctAnswer
    const pointsAwarded = isCorrect ? ans.points : 0

    score += pointsAwarded
    totalPoints += ans.points
  }

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100 * 10) / 10 : 0
  const passed = percentage >= passMarkPct

  return { score, totalPoints, percentage, passed }
}

export function gradeSession(
  responses: StudentResponse[],
  answers: GradableAnswer[],
  passMarkPct: number = EASA_DEFAULTS.passMarkPct,
): ScoreResult {
  return calculateScore(responses, answers, passMarkPct)
}
