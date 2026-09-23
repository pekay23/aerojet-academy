/**
 * EASA Part-66 Compliance Layer
 *
 * Implements regulatory attempt limits per EASA Part-66 / EU 2018/1142:
 * - Maximum 3 attempts per module within 12-month period
 * - 90-day minimum wait between attempts
 * - After 3 failures: mandatory 12-month ban + additional training
 * - 10-year completion window for all modules
 *
 * This layer sits ABOVE the attempt-types vocabulary and enforces
 * regulatory rules before allowing bookings/exams.
 */

import { prismaUnfiltered } from '@/lib/prisma/client'
import { getBankRules } from '@/lib/internal-exam/engine'
import { resolveAttemptType, AttemptType } from '@/lib/exams/attempt-types'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComplianceStatus =
  | 'ELIGIBLE'
  | 'WAIT_PERIOD_ACTIVE'
  | 'ATTEMPTS_EXHAUSTED'
  | 'BAN_ACTIVE'
  | 'TRAINING_REQUIRED'
  | 'COMPLETION_WINDOW_EXPIRED'

export interface AttemptRecord {
  attemptNumber: number
  attemptType: AttemptType
  date: Date
  passed: boolean
  score?: number
}

export interface ComplianceCheckResult {
  status: ComplianceStatus
  eligible: boolean
  reason: string
  nextEligibleDate?: Date
  attemptsUsed: number
  attemptsRemaining: number
  banLiftDate?: Date
  completionWindowExpiry?: Date
  requiresTraining: boolean
}

export interface ModuleComplianceConfig {
  maxAttempts: number
  waitDaysBetweenAttempts: number
  banDurationMonths: number
  completionWindowYears: number
  passMarkPct: number
}

// ---------------------------------------------------------------------------
// Default EASA Configuration (from engine.ts + business rules)
// ---------------------------------------------------------------------------

export const EASA_COMPLIANCE_DEFAULTS: ModuleComplianceConfig = {
  maxAttempts: 3,
  waitDaysBetweenAttempts: 90,
  banDurationMonths: 12,
  completionWindowYears: 10,
  passMarkPct: ACADEMIC_RULES.EASA_PASS_MARK,
}

// ---------------------------------------------------------------------------
// Get effective rules for a module (bank)
// ---------------------------------------------------------------------------

export async function getModuleComplianceConfig(bankId: string): Promise<ModuleComplianceConfig> {
  const rules = await getBankRules(bankId)

  return {
    maxAttempts: rules.maxRetakes ?? EASA_COMPLIANCE_DEFAULTS.maxAttempts,
    waitDaysBetweenAttempts: rules.retakeWaitDays,
    banDurationMonths: EASA_COMPLIANCE_DEFAULTS.banDurationMonths,
    completionWindowYears: rules.completionWindowYears,
    passMarkPct: rules.passMarkPct,
  }
}

// ---------------------------------------------------------------------------
// Get all previous attempts for a student on a module
// ---------------------------------------------------------------------------

export async function getStudentAttemptHistory(
  studentId: string,
  bankId: string
): Promise<AttemptRecord[]> {
  const sessions = await prismaUnfiltered.internalExamSession.findMany({
    where: {
      studentId,
      bankId,
      status: { in: ['COMPLETED', 'TIMED_OUT'] },
    },
    orderBy: { submittedAt: 'asc' },
    select: {
      attemptNumber: true,
      submittedAt: true,
      passed: true,
      score: true,
      totalPoints: true,
      percentage: true,
    },
  })

  return sessions.map((s) => ({
    attemptNumber: s.attemptNumber,
    attemptType: attemptNumberToType(s.attemptNumber),
    date: s.submittedAt ?? new Date(),
    passed: s.passed ?? false,
    score: s.score ?? undefined,
  }))
}

// ---------------------------------------------------------------------------
// Map attempt number to canonical attempt type
// ---------------------------------------------------------------------------

function attemptNumberToType(attemptNumber: number): AttemptType {
  if (attemptNumber === 1) return 'FIRST'
  if (attemptNumber === 2) return 'RESIT_1'
  if (attemptNumber === 3) return 'RESIT_2'
  return `RETAKE_${attemptNumber - 3}` as AttemptType
}

// ---------------------------------------------------------------------------
// Core compliance check
// ---------------------------------------------------------------------------

export async function checkEasaCompliance(
  studentId: string,
  bankId: string,
  proposedAttemptNumber?: number
): Promise<ComplianceCheckResult> {
  const config = await getModuleComplianceConfig(bankId)
  const history = await getStudentAttemptHistory(studentId, bankId)

  const completedAttempts = history.filter((a) => a.date <= new Date())
  const attemptsUsed = completedAttempts.length
  const lastAttempt = completedAttempts[completedAttempts.length - 1]
  const now = new Date()

  // Determine next attempt number
  const nextAttemptNumber = proposedAttemptNumber ?? attemptsUsed + 1

  // Check 10-year completion window (from first attempt)
  if (completedAttempts.length > 0) {
    const firstAttemptDate = completedAttempts[0].date
    const windowExpiry = new Date(firstAttemptDate)
    windowExpiry.setFullYear(windowExpiry.getFullYear() + config.completionWindowYears)

    if (now > windowExpiry) {
      return {
        status: 'COMPLETION_WINDOW_EXPIRED',
        eligible: false,
        reason: `10-year completion window expired (first attempt: ${firstAttemptDate.toISOString().split('T')[0]})`,
        attemptsUsed,
        attemptsRemaining: 0,
        completionWindowExpiry: windowExpiry,
        requiresTraining: true,
      }
    }
  }

  // Check if already passed (no more attempts needed)
  const hasPassed = completedAttempts.some((a) => a.passed)
  if (hasPassed) {
    return {
      status: 'ELIGIBLE',
      eligible: true,
      reason: 'Module already passed',
      attemptsUsed,
      attemptsRemaining: config.maxAttempts - attemptsUsed,
      requiresTraining: false,
    }
  }

  // Check ban status
  if (attemptsUsed >= config.maxAttempts) {
    const lastFailDate = lastAttempt?.date ?? now
    const banLiftDate = new Date(lastFailDate)
    banLiftDate.setMonth(banLiftDate.getMonth() + config.banDurationMonths)

    if (now < banLiftDate) {
      return {
        status: 'BAN_ACTIVE',
        eligible: false,
        reason: `12-month ban active after ${config.maxAttempts} failed attempts`,
        attemptsUsed,
        attemptsRemaining: 0,
        banLiftDate,
        requiresTraining: true,
      }
    }

    // Ban lifted, but training required before next attempt
    return {
      status: 'TRAINING_REQUIRED',
      eligible: false,
      reason: 'Ban lifted but additional training required before re-attempt',
      attemptsUsed,
      attemptsRemaining: 0,
      banLiftDate,
      requiresTraining: true,
    }
  }

  // Check wait period between attempts
  if (lastAttempt) {
    const nextEligibleDate = new Date(lastAttempt.date)
    nextEligibleDate.setDate(nextEligibleDate.getDate() + config.waitDaysBetweenAttempts)

    if (now < nextEligibleDate) {
      return {
        status: 'WAIT_PERIOD_ACTIVE',
        eligible: false,
        reason: `${config.waitDaysBetweenAttempts}-day wait period active since last attempt`,
        attemptsUsed,
        attemptsRemaining: config.maxAttempts - attemptsUsed,
        nextEligibleDate,
        requiresTraining: false,
      }
    }
  }

  // All checks passed
  return {
    status: 'ELIGIBLE',
    eligible: true,
    reason: 'Eligible for attempt',
    attemptsUsed,
    attemptsRemaining: config.maxAttempts - attemptsUsed,
    requiresTraining: false,
  }
}

// ---------------------------------------------------------------------------
// Get the canonical attempt type for the next allowed attempt
// ---------------------------------------------------------------------------

export async function getNextAttemptType(studentId: string, bankId: string): Promise<AttemptType> {
  const compliance = await checkEasaCompliance(studentId, bankId)

  if (!compliance.eligible && compliance.status !== 'WAIT_PERIOD_ACTIVE') {
    // If banned or training required, the next attempt would be a retake
    const history = await getStudentAttemptHistory(studentId, bankId)
    const failedAttempts = history.filter((a) => !a.passed).length
    return attemptNumberToType(failedAttempts + 1)
  }

  const nextAttemptNumber = compliance.attemptsUsed + 1
  return attemptNumberToType(nextAttemptNumber)
}

// ---------------------------------------------------------------------------
// Validate a booking/request against compliance rules
// ---------------------------------------------------------------------------

export interface BookingValidationInput {
  studentId: string
  bankId: string
  attemptType?: string
  examDate: Date
}

export async function validateBookingCompliance(
  input: BookingValidationInput
): Promise<{ valid: boolean; error?: string; compliance: ComplianceCheckResult }> {
  const { studentId, bankId, attemptType, examDate } = input

  const compliance = await checkEasaCompliance(studentId, bankId)

  if (!compliance.eligible) {
    return {
      valid: false,
      error: compliance.reason,
      compliance,
    }
  }

  // If attempt type provided, validate it matches expected
  if (attemptType) {
    const resolved = resolveAttemptType(attemptType)
    const expectedType = await getNextAttemptType(studentId, bankId)

    if (resolved !== expectedType) {
      return {
        valid: false,
        error: `Attempt type mismatch: expected ${expectedType}, got ${resolved}`,
        compliance,
      }
    }
  }

  // Check exam date is not before wait period
  if (compliance.nextEligibleDate && examDate < compliance.nextEligibleDate) {
    return {
      valid: false,
      error: `Exam date is before eligible date (${compliance.nextEligibleDate.toISOString().split('T')[0]})`,
      compliance,
    }
  }

  return { valid: true, compliance }
}

// ---------------------------------------------------------------------------
// Record a completed attempt (for audit trail)
// ---------------------------------------------------------------------------

export interface RecordAttemptInput {
  studentId: string
  bankId: string
  attemptNumber: number
  attemptType: AttemptType
  passed: boolean
  score?: number
  totalPoints?: number
  percentage?: number
}

export async function recordAttemptCompletion(input: RecordAttemptInput): Promise<void> {
  // This is handled by the session completion logic in engine.ts
  // This function exists for external callers who need to manually record
  await prismaUnfiltered.internalExamSession.updateMany({
    where: {
      studentId: input.studentId,
      bankId: input.bankId,
      attemptNumber: input.attemptNumber,
    },
    data: {
      passed: input.passed,
      score: input.score,
      totalPoints: input.totalPoints,
      percentage: input.percentage,
      submittedAt: new Date(),
    },
  })
}

// ---------------------------------------------------------------------------
// Check if student can book a retake (new course enrollment)
// ---------------------------------------------------------------------------

export async function canBookRetake(
  studentId: string,
  bankId: string
): Promise<{ allowed: boolean; reason: string }> {
  const compliance = await checkEasaCompliance(studentId, bankId)

  if (compliance.status === 'BAN_ACTIVE') {
    return {
      allowed: false,
      reason: `Ban active until ${compliance.banLiftDate?.toISOString().split('T')[0]}. Training required.`,
    }
  }

  if (compliance.status === 'TRAINING_REQUIRED') {
    return {
      allowed: true,
      reason: 'Ban lifted. Additional training required before exam.',
    }
  }

  if (compliance.status === 'COMPLETION_WINDOW_EXPIRED') {
    return {
      allowed: false,
      reason: '10-year completion window expired. Full re-enrollment required.',
    }
  }

  return {
    allowed: true,
    reason: 'Eligible for retake',
  }
}
