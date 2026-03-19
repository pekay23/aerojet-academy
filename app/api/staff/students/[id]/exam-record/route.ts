import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/staff/students/[id]/exam-record
 *
 * Add a historical exam record for a student (past exam with score/result).
 */
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const studentId = context?.params?.id
    if (!studentId) return apiError('Student ID required')

    const body = await req.json()
    const { bookingType, examDate, attemptType, notes, entries } = body as {
      bookingType: 'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK'
      examDate: string
      attemptType?: string
      notes?: string
      entries: { courseId?: string; moduleCode: string; score?: number }[]
    }

    if (!entries || entries.length === 0) {
      return apiError('At least one entry is required')
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: 'STUDENT' },
    })
    if (!student) return apiError('Student not found')

    // Process each entry
    const createdBookings = []
    const bookingGroupRef = entries.length > 1 ? `MANUAL_${Date.now()}` : undefined

    for (const entry of entries) {
      let finalModuleCode = entry.moduleCode.toUpperCase()
      if (entry.courseId) {
        const course = await prisma.course.findUnique({ where: { id: entry.courseId } })
        if (course) finalModuleCode = course.code.toUpperCase()
      }

      // Derive result from score if provided
      let result: string | undefined
      let percentage: number | undefined
      if (entry.score !== undefined && entry.score !== null) {
        percentage = entry.score
        result = entry.score >= 75 ? 'pass' : 'fail'
      }

      const booking = await prisma.examBooking.create({
        data: {
          userId: studentId,
          courseId: entry.courseId,
          moduleCode: finalModuleCode,
          examDate: examDate ? new Date(examDate) : null,
          amountPaid: 0,
          status: 'COMPLETED',
          bookingType: bookingType as any,
          attemptType: attemptType || 'FIRST',
          result,
          score: entry.score,
          percentage,
          sourceNotes: notes || 'Manually added by staff',
          bookingGroupRef,
        },
      })
      createdBookings.push(booking)
    }

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Exam Record Added',
        message: `An admin has added exam record(s) for ${entries.map((e) => e.moduleCode).join(', ')}.`,
        type: 'INFO',
        sentBy: staff.id,
        linkUrl: '/student/exams',
        linkText: 'View Exams',
      },
    })

    // Revalidate paths
    revalidatePath('/student')
    revalidatePath('/student/exams')
    revalidatePath('/student/notifications')
    revalidatePath('/staff/exams')
    revalidatePath(`/staff/students/${studentId}`)

    return apiSuccess({
      success: true,
      count: createdBookings.length,
      bookingIds: createdBookings.map((b) => b.id),
    })
  }
)
