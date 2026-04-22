'use server'

import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { UserStatus, UserRole, PaymentStatus } from '@/types/enums'

/**
 * Fetches all users that staff can message: Students, Instructors, other Staff/Admins.
 * Groups them by role for easier selection.
 */
export async function getStaffRecipients() {
  const user = await requireStaff().catch(() => null)
  if (!user) return []

  const users = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
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
      data: { status: UserStatus.ARCHIVED as any },
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
 * Updates an exam record (can be an ExamBooking or ExamResult ID).
 */
export async function updateExamBooking(
  recordId: string,
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
    resultIdToSync?: string
  }
) {
  try {
    await requireStaff()

    const isResultId = recordId.startsWith('result_')
    const actualId = isResultId ? recordId.replace('result_', '') : recordId

    let moduleCode = data.moduleCode
    if (data.courseId) {
      const course = await prisma.course.findUnique({ where: { id: data.courseId } })
      if (course) moduleCode = course.code.toUpperCase()
    }

    const score = data.score !== undefined && data.score !== null ? data.score : undefined
    const percentage = score !== undefined ? score : undefined
    const passed = score !== undefined ? score >= 75 : undefined
    const grade = score !== undefined
      ? score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 75 ? 'C' : 'F'
      : undefined

    if (isResultId) {
      // Pure ExamResult update - No transaction needed for single operation
      await prisma.examResult.update({
        where: { id: actualId },
        data: {
          ...(moduleCode ? { moduleCode } : {}),
          ...(score !== undefined ? { score, maxScore: 100, percentage, passed, grade } : {}),
          ...(data.attemptType ? { attemptType: data.attemptType } : {}),
        },
      })
    } else {
      // For Booking updates which might sync to Result, use a transaction with higher timeout
      // Determine isResit based on attemptType if not explicitly provided
      const isResit = data.isResit !== undefined 
        ? data.isResit 
        : (data.attemptType ? data.attemptType.startsWith('RESIT') : undefined)

      await prisma.$transaction(async (tx) => {
        // It's a booking ID. Update booking first.
        const booking = await tx.examBooking.findUnique({ where: { id: actualId } })
        if (!booking) throw new Error('Booking not found')

        const finalModule = moduleCode || booking.moduleCode || ''
        
        await tx.examBooking.update({
          where: { id: actualId },
          data: {
            ...(moduleCode ? { moduleCode } : {}),
            ...(data.examDate ? { examDate: data.examDate } : {}),
            ...(data.attemptType ? { attemptType: data.attemptType } : {}),
            ...(isResit !== undefined ? { isResit } : {}),
            ...(data.bookingType ? { bookingType: data.bookingType === 'MANUAL' ? 'INDIVIDUAL' : data.bookingType as any } : {}),
            // If the existing result is "migrated" but we have a score, or we're explicitly setting a score, fix it
            ...((score !== undefined || (booking.result?.toUpperCase().includes('MIGRATE') && booking.score != null)) ? { 
              score: score ?? Number(booking.score),
              percentage: score ?? Number(booking.score),
              result: (score ?? Number(booking.score)) >= 75 ? 'pass' : 'fail',
              status: 'COMPLETED'
            } : {}),
          },
        })

        // If score or attemptType is provided, sync to ExamResult
        if (score !== undefined || data.attemptType !== undefined) {
          if (data.resultIdToSync) {
             // We know exactly which ExamResult belongs to this booking
             await tx.examResult.update({
               where: { id: data.resultIdToSync },
               data: { 
                 score, 
                 maxScore: 100, 
                 percentage, 
                 passed, 
                 grade, 
                 attemptType: data.attemptType || booking.attemptType,
                 moduleCode: finalModule
               },
             })
          } else {
            // Look for existing ExamResult for this user and module
            const existingResult = await tx.examResult.findFirst({
              where: {
                userId: booking.userId,
                moduleCode: finalModule,
              },
              orderBy: { createdAt: 'desc' }
            })

            if (existingResult) {
              await tx.examResult.update({
                where: { id: existingResult.id },
                data: { score, maxScore: 100, percentage, passed, grade, attemptType: data.attemptType || booking.attemptType },
              })
            } else {
              await tx.examResult.create({
                data: {
                  userId: booking.userId,
                  moduleCode: finalModule,
                  score,
                  maxScore: 100,
                  percentage,
                  passed: passed as boolean,
                  grade,
                  attemptType: data.attemptType || booking.attemptType,
                  sourceNotes: 'Auto-created from booking update',
                },
              })
            }
          }
        }
      }, {
        timeout: 30000 // Increase timeout to 30s to handle slow DB connections (P2028 fix)
      })
    }

    // Get userId for revalidation
    let targetUserId = ''
    if (isResultId) {
      const res = await prisma.examResult.findUnique({ where: { id: actualId }, select: { userId: true } })
      targetUserId = res?.userId || ''
    } else {
      const b = await prisma.examBooking.findUnique({ where: { id: actualId }, select: { userId: true } })
      targetUserId = b?.userId || ''
    }

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    if (targetUserId) {
      revalidatePath(`/staff/students/${targetUserId}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Update exam result error:', error)
    return { error: 'Failed to update record.' }
  }
}

/**
 * Creates one or more ExamResult records for a student.
 * Also creates a companion ExamBooking for payment/status tracking.
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

    const pricingMap = {
      INDIVIDUAL: pricingConfig.individualExamFee,
      TWIN_PACK: pricingConfig.twoSeatBundle,
      FOUR_PACK: pricingConfig.fourSeatBundle,
    }

    const totalFee = Number((pricingMap as any)[bookingType] || pricingConfig.individualExamFee)
    const bookingGroupRef = entries.length > 1 ? `STAFF_BUNDLE_${Date.now()}` : undefined

    const results = await prisma.$transaction(async (tx) => {
      const created = []

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        let finalModuleCode = entry.moduleCode.toUpperCase()
        if (entry.courseId) {
          const course = await tx.course.findUnique({ where: { id: entry.courseId } })
          if (course) finalModuleCode = course.code.toUpperCase()
        }

        const hasScore = entry.score !== undefined && entry.score !== null
        const isFutureBooking = !hasScore
        const amountPaid = i === 0 && isFutureBooking ? totalFee : 0
        const status = isFutureBooking ? PaymentStatus.PENDING : PaymentStatus.COMPLETED

        // Create the booking (pure ledger — no result fields)
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
            bookingGroupRef,
          },
        })

        // If a score was provided, create an ExamResult with correct passed
        if (hasScore) {
          const score = Number(entry.score)
          const passed = score >= 75
          const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 75 ? 'C' : 'F'
          await tx.examResult.create({
            data: {
              userId,
              moduleCode: finalModuleCode,
              score,
              maxScore: 100,
              percentage: score,
              passed,
              grade,
              attemptType: attemptType || 'FIRST',
              sourceNotes: notes || 'Manually added by staff',
            },
          })
        }

        created.push(booking)
      }
      return created
    })

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    revalidatePath('/student')
    revalidatePath(`/staff/students/${data.userId}`)
    return { success: true, count: results.length }
  } catch (error) {
    console.error('Create exam record error:', error)
    return { error: 'Failed to create record.' }
  }
}

/**
 * Deletes an ExamResult record (Records tab).
 */
export async function deleteExamRecord(resultId: string) {
  try {
    await requireStaff()

    await prisma.examResult.delete({ where: { id: resultId } })

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    console.error('Delete exam result error:', error)
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
        role: { in: [UserRole.STUDENT, UserRole.APPLICANT] },
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

/**
 * Updates the target monthly revenue setting.
 */
export async function updateRevenueTarget(amount: number) {
  try {
    await requireStaff()
    const { updateSystemSetting } = await import('@/lib/settings')
    await updateSystemSetting('target_monthly_revenue', amount.toString())
    revalidatePath('/staff/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Update revenue target error:', error)
    return { error: 'Failed to update target.' }
  }
}
