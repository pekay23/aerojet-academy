/**
 * Internal Exam Engine — EASA-compliant rules and question selection
 *
 * EASA Part-66 exam rules:
 * - 3-option MCQ (A, B, C)
 * - 75 seconds per question
 * - 75% pass mark
 * - 90-day retake wait
 * - 3 attempts max, then 12-month ban
 * - 10-year completion window
 * - Stratified random selection with exposure-based deprioritization
 */

import { prismaUnfiltered } from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'
import { calculateMinimumPoolSize } from '@/lib/easa/module-requirements'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'

// ---------------------------------------------------------------------------
// EASA DEFAULT RULES
// ---------------------------------------------------------------------------

export const EASA_DEFAULTS = {
  passMarkPct: ACADEMIC_RULES.EASA_PASS_MARK,
  timePerQuestionSecs: ACADEMIC_RULES.TIME_PER_QUESTION_SECS,
  retakeWaitDays: 90,
  maxRetakes: 3,
  banDurationMonths: 12,
  completionWindowYears: 10,
  allowKeyboardAutoSubmit: true,
}

export async function isInternalExamSystemEnabled(): Promise<boolean> {
  const value = await getSystemSetting('internal_exam_system_enabled', 'false')
  return value === 'true'
}

// ---------------------------------------------------------------------------
// Get effective rules for a bank (defaults + overrides)
// ---------------------------------------------------------------------------

export async function getBankRules(bankId: string) {
  const override = await prismaUnfiltered.internalExamRuleOverride.findUnique({
    where: { bankId },
  })

  return {
    passMarkPct: override?.passMarkPct ?? EASA_DEFAULTS.passMarkPct,
    timePerQuestionSecs: override?.timePerQuestionSecs ?? EASA_DEFAULTS.timePerQuestionSecs,
    retakeWaitDays: override?.retakeWaitDays ?? EASA_DEFAULTS.retakeWaitDays,
    maxRetakes: override?.maxRetakes ?? EASA_DEFAULTS.maxRetakes,
    completionWindowYears: override?.completionWindowYears ?? EASA_DEFAULTS.completionWindowYears,
    allowKeyboardAutoSubmit:
      override?.allowKeyboardAutoSubmit ?? EASA_DEFAULTS.allowKeyboardAutoSubmit,
    customInstructions: override?.customInstructions ?? null,
  }
}

// ---------------------------------------------------------------------------
// Question pool health indicator (5x minimum bank size)
// ---------------------------------------------------------------------------

export type PoolHealth = 'GREEN' | 'AMBER' | 'RED'

export async function getPoolHealth(
  bankId: string
): Promise<{ health: PoolHealth; questionCount: number; requiredMinimum: number }> {
  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { mcqCount: true, minimumPoolSize: true, moduleCode: true, categoryCode: true },
  })
  if (!bank) return { health: 'RED', questionCount: 0, requiredMinimum: 0 }

  const questionCount = await prismaUnfiltered.internalExamQuestion.count({
    where: { bankId, isActive: true, status: 'APPROVED' },
  })

  const easaMinimum = bank.moduleCode
    ? calculateMinimumPoolSize(bank.moduleCode, bank.categoryCode)
    : null
  const requiredMinimum = easaMinimum ?? bank.minimumPoolSize ?? bank.mcqCount * 5
  const ratio = questionCount / requiredMinimum

  let health: PoolHealth = 'RED'
  if (ratio >= 1.0) health = 'GREEN'
  else if (ratio >= 0.6) health = 'AMBER'

  return { health, questionCount, requiredMinimum }
}

// ---------------------------------------------------------------------------
// Stratified random selection with exposure-based deprioritization
// ---------------------------------------------------------------------------

function shuffle<T>(array: T[]): T[] {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function selectInternalExamQuestions(bankId: string, count: number) {
  const questions = await prismaUnfiltered.internalExamQuestion.findMany({
    where: { bankId, isActive: true, status: 'APPROVED', isEssay: false },
    select: {
      id: true,
      subTopic: true,
      syllabusRef: true,
      difficulty: true,
      knowledgeLevel: true,
      timesServed: true,
      lastServedAt: true,
    },
    orderBy: [{ timesServed: 'asc' }, { lastServedAt: 'asc' }],
  })

  // Group by syllabusRef or subTopic for stratified selection
  const byTopic: Record<string, typeof questions> = {}
  for (const q of questions) {
    const key = q.syllabusRef || q.subTopic || '__general__'
    if (!byTopic[key]) byTopic[key] = []
    byTopic[key].push(q)
  }

  const topics = Object.keys(byTopic)
  const perTopic = Math.max(1, Math.floor(count / topics.length))
  const selected: string[] = []

  // Stratified: pick evenly from each topic, prioritizing least-served
  for (const topic of topics) {
    const pool = byTopic[topic]
    const minServed = pool[0]?.timesServed ?? 0
    const leastServed = pool.filter((q) => q.timesServed === minServed)

    let picked: typeof pool
    if (leastServed.length >= perTopic) {
      picked = shuffle(leastServed).slice(0, perTopic)
    } else {
      const rest = pool.filter((q) => q.timesServed > minServed)
      picked = [...leastServed, ...shuffle(rest).slice(0, perTopic - leastServed.length)]
    }
    selected.push(...picked.map((q) => q.id))
  }

  // Fill remaining from global pool if needed
  if (selected.length < count) {
    const remaining = questions.filter((q) => !selected.includes(q.id))
    const fill = shuffle(remaining).slice(0, count - selected.length)
    selected.push(...fill.map((q) => q.id))
  }

  // Trim to exact count
  const final = shuffle(selected).slice(0, count)

  // Update exposure tracking
  if (final.length > 0) {
    await prismaUnfiltered.internalExamQuestion.updateMany({
      where: { id: { in: final } },
      data: { timesServed: { increment: 1 }, lastServedAt: new Date() },
    })
  }

  return final
}

// ---------------------------------------------------------------------------
// Eligibility check (retake wait, attempt limit, ban) — uses compliance layer
// ---------------------------------------------------------------------------

export { checkEasaCompliance as checkEligibility } from '@/lib/compliance/easa-attempts'
export type { ComplianceCheckResult, ModuleComplianceConfig } from '@/lib/compliance/easa-attempts'

// ---------------------------------------------------------------------------
// Build randomised paper (shuffled question order + shuffled options)
// ---------------------------------------------------------------------------

export interface RandomizedPaper {
  paper: {
    id: string
    text: string
    options: string[]
    points: number
    subTopic?: string | null
    syllabusRef?: string | null
  }[]
  questionOrder: string[]
}

export async function buildRandomizedPaper(
  rawQuestions: Array<{
    id: string
    text: string
    options: string[]
    points: number
    subTopic?: string | null
    syllabusRef?: string | null
  }>
): Promise<RandomizedPaper> {
  const shuffledQuestions = shuffle(
    rawQuestions.map((q) => ({ ...q, options: shuffle(q.options) }))
  )
  const questionOrder = shuffledQuestions.map((q) => q.id)

  return {
    paper: shuffledQuestions,
    questionOrder,
  }
}
