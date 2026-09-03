'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { BookingType, ExamCategory, PaymentStatus } from '@prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { handleActionError } from '@/lib/staff/errors'
import { getRequestContext } from '@/lib/server/request-context'

export async function bulkUpdateExamBookingStatus(bookingIds: string[], status: PaymentStatus) {
  try {
    await requireStaff()
    if (!bookingIds.length || !status) return { error: 'Invalid parameters.' }

    await prismaUnfiltered.examBooking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status },
    })

    revalidatePath('/staff/exams', 'page')
    revalidatePath('/student/exams', 'page')
    revalidatePath('/staff/reports', 'page')
    return { success: true }
  } catch (error) {
    return {
      error: handleActionError('bulkUpdateExamBookingStatus', error, 'Failed to update bookings.'),
    }
  }
}

export interface ExamRecordUpdateData {
  courseId?: string
  bookingType?: string
  moduleCode?: string
  examDate?: Date
  score?: number
  result?: string
  status?: PaymentStatus
  attemptType?: string
  isResit?: boolean
  isMigrated?: boolean
  migrationRef?: string
  resultIdToSync?: string
  examCategory?: 'INTERNAL' | 'OFFICIAL_EASA'
  certificateUrl?: string | null
  certificateIssued?: Date | null
  supervisorOverrideJustification?: string
}

async function resolveTargetStudent(
  prisma: typeof prismaUnfiltered,
  actualId: string,
  isResultId: boolean
): Promise<{ userId: string; name: string }> {
  let targetUserId = ''
  if (isResultId) {
    const res = await prisma.examResult.findUnique({
      where: { id: actualId },
      select: { userId: true },
    })
    targetUserId = res?.userId || ''
  } else {
    const b = await prisma.examBooking.findUnique({
      where: { id: actualId },
      select: { userId: true },
    })
    targetUserId = b?.userId || ''
  }
  let targetStudentName = 'unknown'
  if (targetUserId) {
    const profile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
      select: { firstName: true, lastName: true },
    })
    if (profile) targetStudentName = `${profile.firstName} ${profile.lastName}`
  }
  return { userId: targetUserId, name: targetStudentName }
}

async function finalizeExamUpdate(
  staff: { id: string; role: string },
  actualId: string,
  isResultId: boolean,
  targetUserId: string,
  targetStudentName: string,
  data: ExamRecordUpdateData,
  moduleCode: string | undefined,
  score: number | undefined,
  overrides?: { resultLocked?: boolean; supervisorOverride?: string }
) {
  revalidatePath('/staff/exams')
  revalidatePath('/student/exams')
  if (targetUserId) {
    revalidatePath(`/staff/students/${targetUserId}`)
  }

  const ctx = await getRequestContext()
  await createAuditLog({
    userId: staff.id,
    action: AuditAction.UPDATE,
    entity: isResultId ? 'ExamResult' : 'ExamBooking',
    entityId: actualId,
    description: `Updated ${isResultId ? 'exam result' : 'exam booking'} record for student ${targetStudentName}.${isResultId && data.supervisorOverrideJustification ? ` Supervisor override: ${data.supervisorOverrideJustification}` : ''}`,
    changes: {
      recordId: actualId,
      targetUserId,
      fields: Object.keys(data),
      moduleCode,
      score,
      result: data.result,
      status: data.status,
      attemptType: data.attemptType,
      examCategory: data.examCategory,
      resultLocked:
        overrides?.resultLocked ??
        (isResultId ? (data.supervisorOverrideJustification ? false : undefined) : undefined),
      supervisorOverride:
        overrides?.supervisorOverride ?? (data.supervisorOverrideJustification || undefined),
      certificateUrl: data.certificateUrl,
      certificateIssued: data.certificateIssued?.toISOString?.() || data.certificateIssued,
    },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })
  return { success: true }
}

interface BookingResultSyncData {
  bookingId: string
  userId: string
  moduleCode: string
  score: number | undefined
  percentage: number | undefined
  passed: boolean | undefined
  grade: string | undefined
  attemptType?: string
  examCategory?: string
  isMigrated?: boolean
  migrationRef?: string
  resultIdToSync?: string
}

/**
 * Syncs booking-level score/attempt data to the exam_results table.
 * Separated from updateExamBooking to maintain booking/result domain boundaries.
 */
async function syncExamResultFromBooking(
  tx: any,
  booking: { userId: string; moduleCode?: string | null },
  sync: BookingResultSyncData
) {
  if (sync.score === undefined && !sync.attemptType && !sync.examCategory) return

  const {
    userId,
    moduleCode: finalModule,
    score,
    percentage,
    passed,
    grade,
    attemptType,
    examCategory,
    isMigrated,
    migrationRef,
    resultIdToSync,
  } = sync

  if (resultIdToSync) {
    await tx.examResult.update({
      where: { id: resultIdToSync },
      data: {
        ...(score !== undefined ? { score, maxScore: 100, percentage, passed, grade } : {}),
        ...(attemptType !== undefined ? { attemptType } : {}),
        ...(examCategory !== undefined ? { examCategory: examCategory as ExamCategory } : {}),
        moduleCode: finalModule,
        migrationRef:
          isMigrated !== undefined
            ? isMigrated
              ? migrationRef || 'MANUAL_CORRECTION'
              : null
            : undefined,
      },
    })
  } else {
    const existingResult = await tx.examResult.findFirst({
      where: { userId, moduleCode: finalModule },
      orderBy: { createdAt: 'desc' },
    })

    if (existingResult) {
      await tx.examResult.update({
        where: { id: existingResult.id },
        data: {
          ...(score !== undefined ? { score, maxScore: 100, percentage, passed, grade } : {}),
          ...(attemptType !== undefined ? { attemptType } : {}),
          ...(examCategory !== undefined ? { examCategory: examCategory as ExamCategory } : {}),
          migrationRef:
            isMigrated !== undefined
              ? isMigrated
                ? migrationRef || 'MANUAL_CORRECTION'
                : null
              : undefined,
        },
      })
    } else {
      await tx.examResult.create({
        data: {
          userId,
          moduleCode: finalModule,
          score: score ?? 0,
          maxScore: 100,
          percentage: score ?? 0,
          passed: (score ?? 0) >= 75,
          grade: grade || 'F',
          ...(attemptType !== undefined ? { attemptType } : {}),
          ...(examCategory !== undefined ? { examCategory: examCategory as ExamCategory } : {}),
          migrationRef: isMigrated ? migrationRef || 'MANUAL_CORRECTION' : undefined,
          sourceNotes: 'Auto-created from booking update',
        },
      })
    }
  }
}

export async function updateExamBooking(bookingId: string, data: ExamRecordUpdateData) {
  try {
    const staff = await requireStaff()
    const moduleCode = data.moduleCode?.toUpperCase()
    const score = data.score !== undefined && data.score !== null ? data.score : undefined
    const percentage = score !== undefined ? score : undefined
    const passed = score !== undefined ? score >= 75 : undefined
    const grade =
      score !== undefined
        ? score >= 90
          ? 'A'
          : score >= 80
            ? 'B'
            : score >= 75
              ? 'C'
              : 'F'
        : undefined

    const isResit =
      data.isResit !== undefined
        ? data.isResit
        : data.attemptType
          ? data.attemptType.startsWith('RESIT')
          : undefined

    await prismaUnfiltered.$transaction(
      async (tx) => {
        const booking = await tx.examBooking.findUnique({ where: { id: bookingId } })
        if (!booking) throw new Error('Booking not found')

        const finalModule = moduleCode || booking.moduleCode || ''

        await tx.examBooking.update({
          where: { id: bookingId },
          data: {
            ...(moduleCode ? { moduleCode } : {}),
            ...(data.examDate ? { examDate: data.examDate } : {}),
            ...(data.attemptType ? { attemptType: data.attemptType } : {}),
            ...(data.examCategory ? { examCategory: data.examCategory as ExamCategory } : {}),
            ...(isResit !== undefined ? { isResit } : {}),
            ...(data.bookingType ? { bookingType: data.bookingType as BookingType } : {}),
            ...(!data.isMigrated &&
            (score !== undefined ||
              data.attemptType ||
              data.examCategory ||
              (booking.result?.toUpperCase().includes('MIGRATE') && booking.score != null))
              ? {
                  score: score ?? (booking.score != null ? Number(booking.score) : undefined),
                  percentage: score ?? (booking.score != null ? Number(booking.score) : undefined),
                  result:
                    (score ?? (booking.score != null ? Number(booking.score) : 0)) >= 75
                      ? 'pass'
                      : 'fail',
                  status: PaymentStatus.APPROVED,
                }
              : {}),
            ...(data.isMigrated !== undefined
              ? {
                  result: data.isMigrated
                    ? 'MIGRATED'
                    : booking.result === 'MIGRATED'
                      ? 'pass'
                      : booking.result,
                }
              : {}),
          },
        })

        await syncExamResultFromBooking(tx, booking, {
          bookingId,
          userId: booking.userId,
          moduleCode: finalModule,
          score,
          percentage,
          passed,
          grade,
          attemptType: data.attemptType,
          examCategory: data.examCategory as ExamCategory | undefined,
          isMigrated: data.isMigrated,
          migrationRef: data.migrationRef,
          resultIdToSync: data.resultIdToSync,
        })

        if (score !== undefined) {
          await tx.examAttendance.upsert({
            where: { bookingId },
            update: { status: 'PRESENT' },
            create: {
              userId: booking.userId,
              bookingId,
              status: 'PRESENT',
              attendanceDate: booking.examDate || new Date(),
              recordedBy: 'system',
              eventId: booking.eventId,
              examId: booking.examId,
              examComponentId: booking.examComponentId,
              classId: booking.courseId ? undefined : undefined,
            },
          })
        }
      },
      {
        timeout: 30000,
      }
    )

    const { userId, name: targetStudentName } = await resolveTargetStudent(
      prismaUnfiltered,
      bookingId,
      false
    )

    return finalizeExamUpdate(
      staff,
      bookingId,
      false,
      userId,
      targetStudentName,
      data,
      moduleCode,
      score
    )
  } catch (error) {
    return { error: handleActionError('updateExamBooking', error, 'Failed to update booking.') }
  }
}

export async function updateExamResult(resultId: string, data: ExamRecordUpdateData) {
  try {
    const staff = await requireStaff()
    const isSupervisor = ['ADMIN', 'SUPER_ADMIN'].includes(staff.role)

    const existingResult = await prismaUnfiltered.examResult.findUnique({
      where: { id: resultId },
      select: { resultLocked: true, lockedBy: true, certificateUrl: true, certificateIssued: true },
    })

    if (existingResult?.resultLocked && !isSupervisor) {
      return {
        error: 'Result is locked and cannot be modified. Contact a supervisor for an override.',
      }
    }

    if (
      existingResult?.resultLocked &&
      isSupervisor &&
      !data.supervisorOverrideJustification?.trim()
    ) {
      return { error: 'Supervisor override justification is required to modify a locked result.' }
    }

    const moduleCode = data.moduleCode?.toUpperCase()
    const score = data.score !== undefined && data.score !== null ? data.score : undefined
    const percentage = score !== undefined ? score : undefined
    const passed = score !== undefined ? score >= 75 : undefined
    const grade =
      score !== undefined
        ? score >= 90
          ? 'A'
          : score >= 80
            ? 'B'
            : score >= 75
              ? 'C'
              : 'F'
        : undefined

    const updateData: Record<string, unknown> = {
      ...(moduleCode ? { moduleCode } : {}),
      ...(score !== undefined ? { score, maxScore: 100, percentage, passed, grade } : {}),
      ...(data.attemptType ? { attemptType: data.attemptType } : {}),
      ...(data.examCategory ? { examCategory: data.examCategory } : {}),
      ...(data.isMigrated !== undefined
        ? {
            migrationRef: data.isMigrated ? data.migrationRef || 'MANUAL_CORRECTION' : null,
          }
        : {}),
    }

    if (data.certificateUrl !== undefined || data.certificateIssued !== undefined) {
      updateData.certificateUrl = data.certificateUrl ?? undefined
      updateData.certificateIssued = data.certificateIssued ?? undefined
      if (data.certificateUrl || data.certificateIssued) {
        updateData.resultLocked = true
        updateData.lockedBy = staff.id
        updateData.lockedAt = new Date()
      }
    }

    if (isSupervisor && data.supervisorOverrideJustification) {
      updateData.resultLocked = false
      updateData.lockedBy = null
      updateData.lockedAt = null
    }

    await prismaUnfiltered.examResult.update({
      where: { id: resultId },
      data: updateData,
    })

    const res = await prismaUnfiltered.examResult.findUnique({
      where: { id: resultId },
      select: { userId: true, moduleCode: true },
    })
    if (res && res.moduleCode) {
      const normModule = res.moduleCode.trim()
      await prismaUnfiltered.examBooking.updateMany({
        where: {
          userId: res.userId,
          OR: [
            { moduleCode: { equals: normModule, mode: 'insensitive' } },
            { moduleCode: { contains: normModule, mode: 'insensitive' } },
          ],
        },
        data: {
          ...(data.attemptType ? { attemptType: data.attemptType } : {}),
          ...(data.examCategory ? { examCategory: data.examCategory } : {}),
          ...(data.bookingType ? { bookingType: data.bookingType as BookingType } : {}),
        },
      })
    }

    const { userId, name: targetStudentName } = await resolveTargetStudent(
      prismaUnfiltered,
      resultId,
      true
    )

    return finalizeExamUpdate(
      staff,
      resultId,
      true,
      userId,
      targetStudentName,
      data,
      moduleCode,
      score,
      {
        resultLocked: data.supervisorOverrideJustification ? false : undefined,
        supervisorOverride: data.supervisorOverrideJustification,
      }
    )
  } catch (error) {
    return { error: handleActionError('updateExamResult', error, 'Failed to update result.') }
  }
}

export async function bulkUpdateExamCategory(
  ids: string[],
  category: 'INTERNAL' | 'OFFICIAL_EASA'
) {
  try {
    await requireStaff()

    if (!ids || ids.length === 0) {
      return { error: 'No records selected' }
    }

    const cleanIds = ids.map((id) => id.replace('result_', ''))

    const affectedBookings = await prismaUnfiltered.examBooking.findMany({
      where: { id: { in: cleanIds } },
      select: { id: true, userId: true, moduleCode: true },
    })

    const affectedResults = await prismaUnfiltered.examResult.findMany({
      where: { id: { in: cleanIds } },
      select: { id: true, userId: true, moduleCode: true },
    })

    const bookingIds = new Set(affectedBookings.map((b) => b.id))
    const resultIds = new Set(affectedResults.map((r) => r.id))

    const pairs = new Set<string>()
    affectedBookings.forEach((b) => {
      if (b.userId && b.moduleCode) pairs.add(`${b.userId}:${b.moduleCode.toUpperCase()}`)
    })
    affectedResults.forEach((r) => {
      if (r.userId && r.moduleCode) pairs.add(`${r.userId}:${r.moduleCode.toUpperCase()}`)
    })

    for (const pair of Array.from(pairs)) {
      const [uId, mCode] = pair.split(':')

      const relatedBookings = await prismaUnfiltered.examBooking.findMany({
        where: {
          userId: uId,
          moduleCode: { equals: mCode, mode: 'insensitive' },
        },
        select: { id: true },
      })
      relatedBookings.forEach((b) => bookingIds.add(b.id))

      const relatedResults = await prismaUnfiltered.examResult.findMany({
        where: {
          userId: uId,
          moduleCode: { equals: mCode, mode: 'insensitive' },
        },
        select: { id: true },
      })
      relatedResults.forEach((r) => resultIds.add(r.id))
    }

    const [bookingCount, resultCount] = await prismaUnfiltered.$transaction([
      prismaUnfiltered.examBooking.updateMany({
        where: { id: { in: Array.from(bookingIds) } },
        data: { examCategory: category },
      }),
      prismaUnfiltered.examResult.updateMany({
        where: { id: { in: Array.from(resultIds) } },
        data: { examCategory: category },
      }),
    ])

    revalidatePath('/staff/exams', 'page')
    revalidatePath('/staff/reports', 'page')
    return { success: true }
  } catch (error) {
    return {
      error: handleActionError('bulkUpdateExamCategory', error, 'Failed to update records.'),
    }
  }
}
