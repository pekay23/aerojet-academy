'use server'

import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Fetches all users that staff can message: Students, Instructors, other Staff/Admins.
 * Groups them by role for easier selection.
 */
export async function getStaffRecipients() {
  const user = await requireStaff().catch(() => null)
  if (!user) return []

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: user.id }, // Exclude self
    },
    select: {
      id: true,
      role: true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
        },
      },
    },
    orderBy: [{ role: 'asc' }],
  })

  return users.map((u) => ({
    id: u.id,
    role: u.role,
    email: u.email,
    label: u.profile
      ? `${u.profile.firstName} ${u.profile.lastName} (${u.role})`
      : `${u.email} (${u.role})`,
    avatarUrl: u.profile?.profilePhotoUrl,
  }))
}

/**
 * Sends a message from the logged-in staff member to a recipient.
 */
export async function sendStaffMessage(recipientId: string, subject: string, body: string) {
  try {
    const user = await requireStaff()

    if (!recipientId || !subject || !body) {
      return { error: 'All fields are required.' }
    }

    await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId,
        subject,
        body,
        isRead: false,
      },
    })

    revalidatePath('/staff/messages')
    return { success: true }
  } catch (error) {
    console.error('Send staff message error:', error)
    return { error: 'Failed to send message.' }
  }
}

/**
 * Marks a message as read.
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const user = await requireStaff()

    await prisma.message.update({
      where: { id: messageId, recipientId: user.id },
      data: { isRead: true, readAt: new Date() },
    })

    revalidatePath('/staff/messages')
    return { success: true }
  } catch (error) {
    console.error('Mark message as read error:', error)
    return { error: 'Failed to mark message as read.' }
  }
}

/**
 * Bulk updates the status of multiple users.
 */
export async function bulkUpdateUserStatus(userIds: string[], status: string) {
  try {
    await requireStaff()

    if (!userIds.length || !status) {
      return { error: 'Invalid parameters.' }
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: status as any },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    console.error('Bulk update user status error:', error)
    return { error: 'Failed to update users.' }
  }
}

/**
 * Bulk permanently deletes multiple users.
 * To soft delete, use bulkArchiveUsers instead.
 */
export async function bulkDeleteUsers(userIds: string[]) {
  try {
    await requireStaff()

    if (!userIds.length) {
      return { error: 'No users selected.' }
    }

    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    console.error('Bulk delete users error:', error)
    return { error: 'Failed to delete users permanently.' }
  }
}

/**
 * Bulk updates the status of multiple enrollments.
 */
export async function bulkUpdateEnrollmentStatus(enrollmentIds: string[], status: string) {
  try {
    await requireStaff()
    if (!enrollmentIds.length || !status) return { error: 'Invalid parameters.' }

    await prisma.enrollment.updateMany({
      where: { id: { in: enrollmentIds } },
      data: { status: status as any },
    })

    revalidatePath('/staff/enrollments')
    return { success: true }
  } catch (error) {
    console.error('Bulk update enrollment status error:', error)
    return { error: 'Failed to update enrollments.' }
  }
}

/**
 * Bulk deletes multiple enrollments.
 */
export async function bulkDeleteEnrollments(enrollmentIds: string[]) {
  try {
    await requireStaff()
    if (!enrollmentIds.length) return { error: 'No enrollments selected.' }

    await prisma.enrollment.deleteMany({
      where: { id: { in: enrollmentIds } },
    })

    revalidatePath('/staff/enrollments')
    return { success: true }
  } catch (error) {
    console.error('Bulk delete enrollments error:', error)
    return { error: 'Failed to delete enrollments.' }
  }
}

/**
 * Bulk updates the status of multiple exam bookings.
 */
export async function bulkUpdateExamBookingStatus(bookingIds: string[], status: any) {
  try {
    await requireStaff()
    if (!bookingIds.length || !status) return { error: 'Invalid parameters.' }

    await prisma.examBooking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status },
    })

    revalidatePath('/staff/exams')
    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    console.error('Bulk update exam booking status error:', error)
    return { error: 'Failed to update bookings.' }
  }
}

/**
 * Bulk updates the status of multiple payments/top-ups.
 */
export async function bulkUpdatePaymentStatus(paymentIds: string[], status: any) {
  try {
    await requireStaff()
    if (!paymentIds.length || !status) return { error: 'Invalid parameters.' }

    await prisma.payment.updateMany({
      where: { id: { in: paymentIds } },
      data: { status },
    })

    revalidatePath('/staff/finance')
    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    console.error('Bulk update payment status error:', error)
    return { error: 'Failed to update payments.' }
  }
}

/**
 * Bulk archives multiple users (soft delete - sets status to ARCHIVED).
 */
export async function bulkArchiveUsers(userIds: string[]) {
  try {
    await requireStaff()
    if (!userIds.length) return { error: 'No users selected.' }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: 'ARCHIVED' as any },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    console.error('Bulk archive users error:', error)
    return { error: 'Failed to archive users.' }
  }
}

/**
 * Bulk bypasses the password change requirement for multiple users.
 */
export async function bulkBypassPasswordChange(userIds: string[]) {
  try {
    await requireStaff()
    if (!userIds.length) return { error: 'No users selected.' }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { mustChangePassword: false },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    console.error('Bulk bypass password change error:', error)
    return { error: 'Failed to update users.' }
  }
}
/**
 * Updates an individual exam booking (used for historical record corrections).
 * Fixed invalid 'passed' field error.
 */
export async function updateExamBooking(
  bookingId: string,
  data: {
    courseId?: string
    bookingType?: string
    moduleCode?: string
    examDate?: Date
    score?: number
    result?: string
    status?: any
    attemptType?: string
    isResit?: boolean
  }
) {
  try {
    await requireStaff()

    const resultData: any = { ...data }

    if (data.courseId) {
      const course = await prisma.course.findUnique({ where: { id: data.courseId } })
      if (course) resultData.moduleCode = course.code.toUpperCase()
    }

    // Derive result from score if score is provided and no explicit result override
    if (data.score !== undefined) {
      resultData.percentage = data.score
      if (!data.result) {
        resultData.result = data.score >= 75 ? 'pass' : 'fail'
      }
    }

    // Derive isResit from attemptType
    if (data.attemptType) {
      resultData.isResit = data.attemptType.startsWith('RESIT')
    }

    await prisma.examBooking.update({
      where: { id: bookingId },
      data: resultData,
    })

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    return { success: true }
  } catch (error) {
    console.error('Update exam booking error:', error)
    return { error: 'Failed to update booking.' }
  }
}

/**
 * Creates one or more exam records (booking) for a student.
 * Supports INDIVIDUAL, TWIN_PACK, and FOUR_PACK booking types.
 */
export async function createExamRecord(data: {
  userId: string
  bookingType: 'INDIVIDUAL' | 'TWIN_PACK' | 'FOUR_PACK'
  examDate: string
  attemptType?: string
  notes?: string
  entries: { courseId?: string; moduleCode: string; score?: number }[]
}) {
  try {
    await requireStaff()

    const { getExamPricingConfig } = await import('@/lib/pools/pricing-config')
    const pricingConfig = await getExamPricingConfig()

    const { userId, bookingType, examDate, attemptType, notes, entries } = data

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { error: 'Student not found.' }

    // Pricing mapping
    const pricingMap = {
      INDIVIDUAL: pricingConfig.individualExamFee,
      TWIN_PACK: pricingConfig.twoSeatBundle,
      FOUR_PACK: pricingConfig.fourSeatBundle,
    }

    const totalFee = Number((pricingMap as any)[bookingType] || pricingConfig.individualExamFee)
    const bookingGroupRef = entries.length > 1 ? `STAFF_BUNDLE_${Date.now()}` : undefined

    const results = await prisma.$transaction(async (tx) => {
      const createdBookings = []

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        let finalModuleCode = entry.moduleCode.toUpperCase()
        if (entry.courseId) {
          const course = await tx.course.findUnique({ where: { id: entry.courseId } })
          if (course) finalModuleCode = course.code.toUpperCase()
        }

        // Derive result from score if provided
        let result: string | undefined
        let percentage: number | undefined
        if (entry.score !== undefined && entry.score !== null) {
          percentage = entry.score
          result = entry.score >= 75 ? 'pass' : 'fail'
        }

        const isFutureBooking = entry.score === undefined || entry.score === null
        // Attach the full fee to the first booking in the group if it's a bundle
        // or just to the single individual booking.
        const amountPaid = i === 0 && isFutureBooking ? totalFee : 0
        const status = isFutureBooking ? 'PENDING' : 'COMPLETED'

        const booking = await tx.examBooking.create({
          data: {
            userId,
            courseId: entry.courseId,
            moduleCode: finalModuleCode,
            examDate: new Date(examDate),
            amountPaid,
            status: status as any,
            bookingType: bookingType as any,
            attemptType: attemptType || 'FIRST',
            result,
            score: entry.score !== undefined ? entry.score : undefined,
            percentage: percentage !== undefined ? percentage : undefined,
            sourceNotes: notes || 'Manually added by staff',
            bookingGroupRef,
          },
        })
        createdBookings.push(booking)
      }
      return createdBookings
    })

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    revalidatePath('/student')
    return { success: true, count: results.length }
  } catch (error) {
    console.error('Create exam record error:', error)
    return { error: 'Failed to create record.' }
  }
}

/**
 * Deletes an exam booking record.
 */
export async function deleteExamRecord(bookingId: string) {
  try {
    await requireStaff()

    await prisma.examBooking.delete({ where: { id: bookingId } })

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    console.error('Delete exam record error:', error)
    return { error: 'Failed to delete record.' }
  }
}

/**
 * Searches students by email, name, or student ID for the exam records form.
 */
export async function searchStudents(query: string) {
  try {
    await requireStaff()

    if (!query || query.length < 2) return { students: [] }

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'APPLICANT'] },
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { profile: { firstName: { contains: query, mode: 'insensitive' } } },
          { profile: { lastName: { contains: query, mode: 'insensitive' } } },
          { studentProfile: { studentId: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        studentProfile: { select: { studentId: true } },
      },
      take: 10,
    })

    return {
      students: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.profile?.firstName || '',
        lastName: u.profile?.lastName || '',
        studentId: u.studentProfile?.studentId || '',
      })),
    }
  } catch (error) {
    console.error('Search students error:', error)
    return { students: [] }
  }
}

/**
 * Fetches all active courses/modules to populate the dropdown.
 */
export async function getAvailableModules() {
  try {
    await requireStaff()
    const modules = await prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    })
    return modules
  } catch (error) {
    console.error('Get available modules error:', error)
    return []
  }
}
