'use server'

import { requireStaff, requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { PaymentStatus } from '@prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { handleActionError } from '@/lib/staff/errors'
import { getRequestContext } from '@/lib/server/request-context'

type AttemptType = 'FIRST' | 'RESIT_1'

type ResultOverride =
  | { kind: 'auto' }
  | { kind: 'explicit'; value: string }

type ExamEntry = {
  courseId?: string
  examComponentId?: string
  moduleCode: string
  score?: number
  resultOverride?: ResultOverride
}

type BookingInput = {
  userId: string
  courseId?: string
  examComponentId?: string
  moduleCode: string
  examDate: Date
  bookingType: 'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK'
  attemptType: AttemptType
  bookingStatus: typeof PaymentStatus.PENDING | typeof PaymentStatus.APPROVED
  result?: 'pass' | 'fail'
  score?: number
  percentage?: number | undefined
  examCategory?: 'INTERNAL' | 'OFFICIAL_EASA'
  bookingGroupRef?: string
  staffId: string
}

type ResultInput = {
  userId: string
  moduleCode: string
  attemptType: AttemptType
  scoreVal: number
  percentage: number | undefined
  passed: boolean
  grade: string
  examCategory?: 'INTERNAL' | 'OFFICIAL_EASA'
  notes?: string
  existingNotes?: string
  override: boolean
}

function normalizeResultOverride(override?: ResultOverride): ResultOverride {
  if (!override || override.kind === 'auto') return { kind: 'auto' }
  return { kind: 'explicit', value: override.value }
}

function resolveAttemptType(raw?: string): AttemptType {
  const normalized = (raw || 'FIRST').toUpperCase().trim()
  if (normalized === 'RESIT_1') return 'RESIT_1'
  return 'FIRST'
}

function validateExamDate(raw: string): Date {
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid exam date format. Use a valid ISO date string.')
  }
  return parsed
}

function validateScore(score?: number): void {
  if (score !== undefined && (score < 0 || score > 100)) {
    throw new Error('Score must be between 0 and 100.')
  }
}

async function resolveModuleCode(tx: Prisma.TransactionClient, entry: ExamEntry): Promise<string> {
  let finalModuleCode = entry.moduleCode.toUpperCase().trim()
  if (entry.courseId && !entry.moduleCode) {
    const course = await tx.course.findUnique({ where: { id: entry.courseId } })
    if (course) finalModuleCode = course.code.toUpperCase().trim()
  }
  return finalModuleCode
}

function computeResult(entry: ExamEntry, isPending: boolean | undefined): { result?: 'pass' | 'fail'; percentage?: number; override: boolean } {
  if (isPending) return { override: false }
  const override = normalizeResultOverride(entry.resultOverride)
  if (override.kind === 'explicit') {
    return { result: override.value as 'pass' | 'fail', percentage: entry.score, override: true }
  }
  if (entry.score !== undefined) {
    const percentage = entry.score
    const result = entry.score >= 75 ? 'pass' : 'fail'
    return { result, percentage, override: false }
  }
  return { override: false }
}

async function upsertExamBooking(tx: Prisma.TransactionClient, input: BookingInput): Promise<string> {
  const {
    userId, courseId, examComponentId, moduleCode, examDate, bookingType,
    attemptType, bookingStatus, result, score, percentage, examCategory,
    bookingGroupRef, _staffId
  } = input

  const existing = await tx.examBooking.findFirst({
    where: { userId, moduleCode, attemptType, deletedAt: null },
  })

  if (existing) {
    await tx.examBooking.update({
      where: { id: existing.id },
      data: {
        courseId: courseId || existing.courseId,
        examComponentId: examComponentId || existing.examComponentId,
        examDate,
        status: bookingStatus,
        result,
        score: score ?? existing.score,
        percentage: percentage ?? existing.percentage,
        examCategory: examCategory || existing.examCategory,
        bookingGroupRef: bookingGroupRef || existing.bookingGroupRef,
      },
    })
    return existing.id
  }

  const created = await tx.examBooking.create({
    data: {
      userId,
      courseId,
      examComponentId,
      moduleCode,
      examDate,
      amountPaid: 0,
      status: bookingStatus,
      bookingType,
      attemptType,
      result,
      score,
      percentage,
      examCategory: examCategory || 'OFFICIAL_EASA',
      bookingGroupRef,
    },
  })
  return created.id
}

async function upsertExamAttendance(tx: Prisma.TransactionClient, bookingId: string, userId: string, examDate: Date, staffId: string): Promise<void> {
  await tx.examAttendance.upsert({
    where: { bookingId },
    update: { status: 'PRESENT' },
    create: {
      userId,
      bookingId,
      status: 'PRESENT',
      attendanceDate: examDate,
      recordedBy: staffId,
    },
  })
}

function computeGrade(percentage: number | undefined): string {
  const p = percentage ?? 0
  if (p >= 90) return 'A'
  if (p >= 80) return 'B'
  if (p >= 75) return 'C'
  return 'F'
}

async function upsertExamResult(tx: Prisma.TransactionClient, input: ResultInput): Promise<void> {
  const { userId, moduleCode, attemptType, scoreVal, percentage, passed, grade, examCategory, notes, existingNotes, _override } = input

  const existing = await tx.examResult.findFirst({
    where: { userId, moduleCode, attemptType },
  })

  if (existing) {
    await tx.examResult.update({
      where: { id: existing.id },
      data: {
        score: scoreVal,
        percentage,
        passed,
        grade,
        examCategory: examCategory || 'OFFICIAL_EASA',
        sourceNotes: notes || existingNotes || 'Manually updated by staff',
      },
    })
  } else {
    await tx.examResult.create({
      data: {
        userId,
        moduleCode,
        score: scoreVal,
        maxScore: 100,
        percentage,
        passed,
        grade,
        attemptType,
        examCategory: examCategory || 'OFFICIAL_EASA',
        sourceNotes: notes || 'Manually added by staff',
      },
    })
  }
}

export async function createExamRecord(data: {
  userId: string
  bookingType: 'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK'
  examDate: string
  attemptType?: string
  examCategory?: 'INTERNAL' | 'OFFICIAL_EASA'
  notes?: string
  isPending?: boolean
  entries: ExamEntry[]
}) {
  try {
    const staff = await requireStaff()
    const { userId, bookingType, examDate, attemptType, examCategory, notes, entries, isPending } = data

    const user = await prismaUnfiltered.user.findUnique({ where: { id: userId } })
    if (!user) return { error: 'Student not found.' }

    const parsedExamDate = validateExamDate(examDate)
    const targetAttemptType = resolveAttemptType(attemptType)

    for (const entry of entries) {
      validateScore(entry.score)
    }

    const bookingGroupRef = entries.length > 1 ? `STAFF_MANUAL_${Date.now()}` : undefined
    const affectedBookingIds: string[] = []
    const overrideCount = { value: 0 }

    await prismaUnfiltered.$transaction(async (tx) => {
      for (const entry of entries) {
        const finalModuleCode = await resolveModuleCode(tx, entry)
        const { result, percentage, override } = computeResult(entry, isPending)
        const bookingStatus = isPending ? PaymentStatus.PENDING : PaymentStatus.APPROVED

        if (override) overrideCount.value++

        const bookingId = await upsertExamBooking(tx, {
          userId,
          courseId: entry.courseId,
          examComponentId: entry.examComponentId,
          moduleCode: finalModuleCode,
          examDate: parsedExamDate,
          bookingType,
          attemptType: targetAttemptType,
          bookingStatus,
          result,
          score: entry.score,
          percentage,
          examCategory: examCategory || 'OFFICIAL_EASA',
          bookingGroupRef,
          staffId: staff.id,
        })
        affectedBookingIds.push(bookingId)

        if (entry.score !== undefined && bookingId) {
          await upsertExamAttendance(tx, bookingId, userId, parsedExamDate, staff.id)
        }

        if (result && ['pass', 'fail'].includes(result)) {
          const scoreVal = entry.score ?? (result === 'pass' ? 75 : 0)
          const grade = computeGrade(percentage)
          await upsertExamResult(tx, {
            userId,
            moduleCode: finalModuleCode,
            attemptType: targetAttemptType,
            scoreVal,
            percentage,
            passed: result === 'pass',
            grade,
            examCategory: examCategory || 'OFFICIAL_EASA',
            notes,
            override,
          })
        }
      }
    })

    revalidatePath('/staff/exams', 'page')
    revalidatePath('/student/exams', 'page')
    revalidatePath(`/staff/students/${userId}`, 'page')
    revalidatePath(`/staff/users/${userId}`, 'page')
    revalidatePath('/staff/reports', 'page')

    const studentProfile = await prismaUnfiltered.profile.findUnique({ where: { userId }, select: { firstName: true, lastName: true } })
    const studentName = studentProfile ? `${studentProfile.firstName} ${studentProfile.lastName}` : user.email

    const ctx = await getRequestContext()
    await createAuditLog({
      userId: staff.id,
      action: AuditAction.CREATE,
      entity: 'ExamBooking',
      entityId: affectedBookingIds[0],
      description: `Created or updated ${affectedBookingIds.length} manual exam record(s) for student ${studentName}.${overrideCount.value > 0 ? ` ${overrideCount.value} record(s) used manual result override.` : ''}`,
      changes: {
        studentId: userId,
        bookingIds: affectedBookingIds,
        bookingType,
        attemptType: targetAttemptType,
        examCategory: examCategory || 'OFFICIAL_EASA',
        isPending: Boolean(isPending),
        moduleCodes: entries.map((entry) => entry.moduleCode?.toUpperCase().trim()).filter(Boolean),
        overridesApplied: overrideCount.value,
      },
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('createExamRecord', error, 'Failed to create record.') }
  }
}

export async function deleteExamRecord(id: string) {
  try {
    const admin = await requireAdmin()

    const actualId = id.replace('result_', '')
    const isResultId = id.startsWith('result_')
    let existing:
      | { id: string; certificateUrl: string | null; deletedAt: Date | null }
      | { id: string; deletedAt: Date | null }
      | null = null

    if (isResultId) {
      existing = await prismaUnfiltered.examResult.findUnique({ where: { id: actualId } })
    } else {
      existing = await prismaUnfiltered.examBooking.findUnique({ where: { id: actualId } })
    }

    if (!existing) return { error: 'Record not found.' }
    if (existing.deletedAt) return { error: 'Record already deleted.' }

    if (isResultId && 'certificateUrl' in existing && existing.certificateUrl) {
      return { error: 'Cannot delete an issued exam result. Contact a SUPER_ADMIN if correction is required.' }
    }

    if (isResultId) {
      await prismaUnfiltered.examResult.update({
        where: { id: actualId },
        data: { deletedAt: new Date() },
      })
    } else {
      await prismaUnfiltered.examBooking.update({
        where: { id: actualId },
        data: { deletedAt: new Date() },
      })
    }

    revalidatePath('/staff/exams', 'page')
    revalidatePath('/staff/reports', 'page')
    const ctx = await getRequestContext()
    await createAuditLog({
      userId: admin.id,
      action: AuditAction.DELETE,
      entity: isResultId ? 'ExamResult' : 'ExamBooking',
      entityId: actualId,
      description: `Soft-deleted ${isResultId ? 'exam result' : 'exam booking'} record ${actualId}.`,
      changes: { ...existing, deletedAt: new Date().toISOString() },
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    })
    return { success: true }
  } catch (error) {
    return { error: handleActionError('deleteExamRecord', error, 'Failed to delete record.') }
  }
}
