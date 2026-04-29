import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/staff/students/[id]/exam-record
 *
 * Add or update a historical exam record for a student.
 * Supports:
 *   - resultOverride: explicitly set pass/fail/deferred/absent
 *   - isPending: mark as pending (no result yet)
 *   - score: numeric score; auto-derives result if resultOverride is 'auto'
 *
 * UPSERT BEHAVIOUR:
 *   If a booking already exists for the same (userId, moduleCode, attemptType),
 *   we UPDATE it rather than reject with a 400. This prevents staff from being
 *   stuck when re-entering data for the same attempt.
 */
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const studentId = context?.params?.id
    if (!studentId) return apiError('Student ID required')

    const body = await req.json()
    const {
      bookingType,
      examDate,
      attemptType,
      examCategory,
      notes,
      entries,
      isPending,
    } = body as {
      bookingType?: 'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK'
      examDate?: string | null
      attemptType?: string
      examCategory?: 'INTERNAL' | 'OFFICIAL_EASA'
      notes?: string
      isPending?: boolean
      entries: {
        courseId?: string
        moduleCode: string
        score?: number
        resultOverride?: string
      }[]
    }

    if (!entries || entries.length === 0) {
      return apiError('At least one entry is required')
    }

    // Verify student exists
    const student = await prisma.user.findUnique({ where: { id: studentId } })
    if (!student) return apiError('Student not found')

    const createdBookings: { id: string; isNew: boolean }[] = []
    const bookingGroupRef = entries.length > 1 ? `MANUAL_${Date.now()}` : undefined

    for (const entry of entries) {
      // Resolve final module code
      let finalModuleCode = (entry.moduleCode || '').toUpperCase().trim()
      if (entry.courseId) {
        const course = await prisma.course.findUnique({ where: { id: entry.courseId } })
        if (course) finalModuleCode = course.code.toUpperCase().trim()
      }
      if (!finalModuleCode) return apiError('Module code is required')

      const targetAttemptType = attemptType || 'FIRST'

      // -----------------------------------------------------------------------
      // Resolve result + percentage
      // -----------------------------------------------------------------------
      let result: string | undefined
      let percentage: number | undefined

      if (isPending) {
        result = undefined
        percentage = undefined
      } else if (entry.resultOverride && entry.resultOverride !== 'auto') {
        result = entry.resultOverride  // 'pass' | 'fail' | 'deferred' | 'absent'
        if (entry.score !== undefined && entry.score !== null) percentage = entry.score
      } else if (entry.score !== undefined && entry.score !== null) {
        percentage = entry.score
        result = entry.score >= 75 ? 'pass' : 'fail'
      }

      const bookingStatus = isPending ? 'PENDING' : 'APPROVED'

      // -----------------------------------------------------------------------
      // UPSERT: update existing booking for same (userId, moduleCode, attemptType)
      // or create a new one.
      // -----------------------------------------------------------------------
      const existing = await prisma.examBooking.findFirst({
        where: {
          userId: studentId,
          moduleCode: finalModuleCode,
          attemptType: targetAttemptType,
          deletedAt: null,
        },
      })

      let bookingId: string
      let isNew: boolean

      if (existing) {
        // Update the existing record
        await prisma.examBooking.update({
          where: { id: existing.id },
          data: {
            courseId: entry.courseId ?? existing.courseId,
            examDate: examDate !== undefined ? (examDate ? new Date(examDate) : null) : existing.examDate,
            result,
            score: entry.score ?? existing.score,
            percentage: percentage ?? existing.percentage,
            status: bookingStatus,
            examCategory: examCategory || existing.examCategory || 'OFFICIAL_EASA',
            bookingGroupRef: bookingGroupRef ?? existing.bookingGroupRef,
          },
        })
        bookingId = existing.id
        isNew = false
      } else {
        // Create a new record
        const created = await prisma.examBooking.create({
          data: {
            userId: studentId,
            courseId: entry.courseId,
            moduleCode: finalModuleCode,
            examDate: examDate ? new Date(examDate) : null,
            amountPaid: 0,
            status: bookingStatus,
            bookingType: bookingType || 'INDIVIDUAL',
            attemptType: targetAttemptType,
            result,
            score: entry.score,
            percentage,
            examCategory: examCategory || 'OFFICIAL_EASA',
            bookingGroupRef,
          },
        })
        bookingId = created.id
        isNew = true
      }

      createdBookings.push({ id: bookingId, isNew })

      // -----------------------------------------------------------------------
      // ExamResult — upsert if we have a conclusive pass/fail
      // -----------------------------------------------------------------------
      if (result && ['pass', 'fail'].includes(result)) {
        const scoreVal = entry.score ?? (result === 'pass' ? 75 : 0)
        const grade =
          (percentage ?? 0) >= 90 ? 'A'
          : (percentage ?? 0) >= 80 ? 'B'
          : (percentage ?? 0) >= 75 ? 'C'
          : 'F'

        const existingResult = await prisma.examResult.findFirst({
          where: {
            userId: studentId,
            moduleCode: finalModuleCode,
            attemptType: targetAttemptType,
          },
        })

        if (existingResult) {
          await prisma.examResult.update({
            where: { id: existingResult.id },
            data: {
              score: scoreVal,
              percentage,
              passed: result === 'pass',
              grade,
              examCategory: examCategory || 'OFFICIAL_EASA',
              sourceNotes: notes || 'Manually updated by staff',
            },
          })
        } else {
          await prisma.examResult.create({
            data: {
              userId: studentId,
              moduleCode: finalModuleCode,
              score: scoreVal,
              maxScore: 100,
              percentage,
              passed: result === 'pass',
              grade,
              attemptType: targetAttemptType,
              examCategory: examCategory || 'OFFICIAL_EASA',
              sourceNotes: notes || 'Manually added by staff',
            },
          })
        }
      }
    }

    // Notification
    const moduleCodes = entries.map((e) => e.moduleCode?.toUpperCase()).filter(Boolean)
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: isPending ? 'Exam Record Created' : 'Exam Record Updated',
        message: isPending
          ? `A pending exam record has been created for: ${moduleCodes.join(', ')}.`
          : `Your exam record(s) for ${moduleCodes.join(', ')} have been updated by staff.`,
        type: 'INFO',
        sentBy: staff.id,
        linkUrl: '/student/exams',
        linkText: 'View Exams',
      },
    })

    // Revalidate
    revalidatePath('/student')
    revalidatePath('/student/exams')
    revalidatePath('/student/notifications')
    revalidatePath('/staff/exams')
    revalidatePath(`/staff/students/${studentId}`)
    revalidatePath(`/staff/users/${studentId}`)

    const newCount = createdBookings.filter((b) => b.isNew).length
    const updatedCount = createdBookings.filter((b) => !b.isNew).length

    return apiSuccess({
      success: true,
      count: createdBookings.length,
      created: newCount,
      updated: updatedCount,
      bookingIds: createdBookings.map((b) => b.id),
    })
  }
)
