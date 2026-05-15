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

// ---------------------------------------------------------------------------
// EASA DEFAULT RULES
// ---------------------------------------------------------------------------

export const EASA_DEFAULTS = {
  passMarkPct: 75,
  timePerQuestionSecs: 75,
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
    allowKeyboardAutoSubmit: override?.allowKeyboardAutoSubmit ?? EASA_DEFAULTS.allowKeyboardAutoSubmit,
    customInstructions: override?.customInstructions ?? null,
  }
}

// ---------------------------------------------------------------------------
// Question pool health indicator (5x minimum bank size)
// ---------------------------------------------------------------------------

export type PoolHealth = 'GREEN' | 'AMBER' | 'RED'

export async function getPoolHealth(bankId: string): Promise<{ health: PoolHealth; questionCount: number; requiredMinimum: number }> {
  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { mcqCount: true, minimumPoolSize: true },
  })
  if (!bank) return { health: 'RED', questionCount: 0, requiredMinimum: 0 }

  const questionCount = await prismaUnfiltered.internalExamQuestion.count({
    where: { bankId, isActive: true },
  })

  const requiredMinimum = bank.minimumPoolSize ?? bank.mcqCount * 5
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
    where: { bankId, isActive: true, isEssay: false },
    select: {
      id: true,
      subTopic: true,
      difficulty: true,
      timesServed: true,
      lastServedAt: true,
    },
    orderBy: [{ timesServed: 'asc' }, { lastServedAt: 'asc' }],
  })

  // Group by subTopic for stratified selection
  const byTopic: Record<string, typeof questions> = {}
  for (const q of questions) {
    const key = q.subTopic || '__general__'
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
    const leastServed = pool.filter(q => q.timesServed === minServed)

    let picked: typeof pool
    if (leastServed.length >= perTopic) {
      picked = shuffle(leastServed).slice(0, perTopic)
    } else {
      const rest = pool.filter(q => q.timesServed > minServed)
      picked = [...leastServed, ...shuffle(rest).slice(0, perTopic - leastServed.length)]
    }
    selected.push(...picked.map(q => q.id))
  }

  // Fill remaining from global pool if needed
  if (selected.length < count) {
    const remaining = questions.filter(q => !selected.includes(q.id))
    const fill = shuffle(remaining).slice(0, count - selected.length)
    selected.push(...fill.map(q => q.id))
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
// Eligibility check (retake wait, attempt limit, ban)
// ---------------------------------------------------------------------------

export async function checkEligibility(studentId: string, bankId: string) {
  const rules = await getBankRules(bankId)
  const now = new Date()

  // Get previous sessions for this student + bank
  const sessions = await prismaUnfiltered.internalExamSession.findMany({
    where: { studentId, bankId, status: { in: ['COMPLETED', 'TIMED_OUT'] } },
    orderBy: { submittedAt: 'desc' },
  })

  // Check active ban
  const latestBan = sessions.find(s => s.banLiftDate && s.banLiftDate > now)
  if (latestBan) {
    return {
      eligible: false,
      reason: `You are banned from this exam until ${latestBan.banLiftDate!.toLocaleDateString()}`,
      banLiftDate: latestBan.banLiftDate,
    }
  }

  // Check retake wait period
  const lastAttempt = sessions[0]
  if (lastAttempt?.submittedAt) {
    const retakeDate = new Date(lastAttempt.submittedAt.getTime() + rules.retakeWaitDays * 24 * 60 * 60 * 1000)
    if (retakeDate > now) {
      return {
        eligible: false,
        reason: `Retake available after ${retakeDate.toLocaleDateString()} (${rules.retakeWaitDays}-day wait)`,
        retakeEligibleAt: retakeDate,
      }
    }
  }

  // Count consecutive failures
  const consecutiveFails = sessions.filter(s => s.passed === false).length
  if (rules.maxRetakes && consecutiveFails >= rules.maxRetakes) {
    // Apply 12-month ban
    const banLift = new Date(now.getFullYear(), now.getMonth() + EASA_DEFAULTS.banDurationMonths, now.getDate())
    return {
      eligible: false,
      reason: `Maximum ${rules.maxRetakes} attempts reached. ${EASA_DEFAULTS.banDurationMonths}-month suspension applied.`,
      banLiftDate: banLift,
    }
  }

  return {
    eligible: true,
    attemptNumber: consecutiveFails + 1,
    totalAttempts: sessions.length,
  }
}
