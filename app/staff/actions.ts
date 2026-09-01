'use server'


import { getAuthSession, requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { BookingType, EnrollmentStatus, ExamCategory, PaymentStatus, UserStatus, UserRole } from '@prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { handleActionError } from '@/lib/staff/errors'
import { serializePrisma } from '@/lib/utils/serialization'

/**
 * Fetches all users that staff can message: Students, Instructors, other Staff/Admins.
 * Groups them by role for easier selection.
 */
export async function getStaffRecipients() {
  const user = await requireStaff().catch(() => null)
  if (!user) return []

  const users = await prismaUnfiltered.user.findMany({
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

    await prismaUnfiltered.message.create({
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
    return { error: handleActionError('sendStaffMessage', error, 'Failed to send message.') }
  }
}

/**
 * Marks a message as read.
 */
export async function markMessageAsRead(messageId: string) {
  try {
    const user = await requireStaff()

    await prismaUnfiltered.message.update({
      where: { id: messageId, recipientId: user.id },
      data: { isRead: true, readAt: new Date() },
    })

    revalidatePath('/staff/messages')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('markMessageAsRead', error, 'Failed to mark message as read.') }
  }
}

/**
 * Bulk updates the status of multiple users.
 */
export async function bulkUpdateUserStatus(userIds: string[], status: UserStatus) {
  try {
    await requireStaff()

    if (!userIds.length || !status) {
      return { error: 'Invalid parameters.' }
    }

    await prismaUnfiltered.user.updateMany({
      where: { id: { in: userIds } },
      data: { status },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkUpdateUserStatus', error, 'Failed to update users.') }
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

    await prismaUnfiltered.user.deleteMany({
      where: { id: { in: userIds } },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkDeleteUsers', error, 'Failed to delete users permanently.') }
  }
}

/**
 * Bulk updates the status of multiple enrollments.
 */
export async function bulkUpdateEnrollmentStatus(enrollmentIds: string[], status: EnrollmentStatus) {
  try {
    await requireStaff()
    if (!enrollmentIds.length || !status) return { error: 'Invalid parameters.' }

    if (['APPROVED', 'ACTIVE', 'GRADUATED'].includes(status)) {
      // Fetch enrollments with course prices to update them individually with the price
      const enrollments = await prismaUnfiltered.enrollment.findMany({
        where: { id: { in: enrollmentIds } },
        include: { course: true }
      })

      await prismaUnfiltered.$transaction(
        enrollments.map((e) =>
          prismaUnfiltered.enrollment.update({
            where: { id: e.id },
            data: { 
              status,
              amountPaid: e.amountPaid && Number(e.amountPaid) > 0 ? e.amountPaid : e.course.price 
            },
          })
        )
      )
    } else {
      await prismaUnfiltered.enrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: { status },
      })
    }

    revalidatePath('/staff/enrollments')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkUpdateEnrollmentStatus', error, 'Failed to update enrollments.') }
  }
}


/**
 * Bulk deletes multiple enrollments.
 */
export async function bulkDeleteEnrollments(enrollmentIds: string[]) {
  try {
    await requireStaff()
    if (!enrollmentIds.length) return { error: 'No enrollments selected.' }

    await prismaUnfiltered.enrollment.deleteMany({
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
    return { error: handleActionError('bulkUpdateExamBookingStatus', error, 'Failed to update bookings.') }
  }
}

/**
 * Bulk updates the status of multiple payments/top-ups.
 */
export async function bulkUpdatePaymentStatus(paymentIds: string[], status: PaymentStatus) {
  try {
    await requireStaff()
    if (!paymentIds.length || !status) return { error: 'Invalid parameters.' }

    await prismaUnfiltered.payment.updateMany({
      where: { id: { in: paymentIds } },
      data: { status },
    })

    revalidatePath('/staff/finance')
    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkUpdatePaymentStatus', error, 'Failed to update payments.') }
  }
}

/**
 * Bulk archives multiple users (soft delete - sets status to ARCHIVED).
 */
export async function bulkArchiveUsers(userIds: string[]) {
  try {
    await requireStaff()
    if (!userIds.length) return { error: 'No users selected.' }

    await prismaUnfiltered.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: UserStatus.ARCHIVED },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkArchiveUsers', error, 'Failed to archive users.') }
  }
}

/**
 * Bulk bypasses the password change requirement for multiple users.
 */
export async function bulkBypassPasswordChange(userIds: string[]) {
  try {
    await requireStaff()
    if (!userIds.length) return { error: 'No users selected.' }

    await prismaUnfiltered.user.updateMany({
      where: { id: { in: userIds } },
      data: { mustChangePassword: false },
    })

    revalidatePath('/staff/users')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkBypassPasswordChange', error, 'Failed to update users.') }
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
    status?: PaymentStatus
    attemptType?: string
    isResit?: boolean
    isMigrated?: boolean
    migrationRef?: string
    resultIdToSync?: string
    examCategory?: 'INTERNAL' | 'OFFICIAL_EASA'
  }
) {
  try {
    const staff = await requireStaff()
    const actualId = recordId.replace('result_', '')
    const isResultId = recordId.startsWith('result_')

    const moduleCode = data.moduleCode?.toUpperCase()
    const score = data.score !== undefined && data.score !== null ? data.score : undefined
    const percentage = score !== undefined ? score : undefined
    const passed = score !== undefined ? score >= 75 : undefined
    const grade = score !== undefined
      ? score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 75 ? 'C' : 'F'
      : undefined

    if (isResultId) {
      // Pure ExamResult update
      await prismaUnfiltered.examResult.update({
        where: { id: actualId },
        data: {
          ...(moduleCode ? { moduleCode } : {}),
          ...(score !== undefined ? { score, maxScore: 100, percentage, passed, grade } : {}),
          ...(data.attemptType ? { attemptType: data.attemptType } : {}),
          ...(data.examCategory ? { examCategory: data.examCategory } : {}),
          ...(data.isMigrated !== undefined ? { 
            migrationRef: data.isMigrated ? (data.migrationRef || 'MANUAL_CORRECTION') : null 
          } : {}),
        },
      })

      // Sync attemptType and examCategory back to the booking(s)
      const res = await prismaUnfiltered.examResult.findUnique({
        where: { id: actualId },
        select: { userId: true, moduleCode: true }
      })
      if (res && res.moduleCode) {
        const normModule = res.moduleCode.trim()
        const updateRes = await prismaUnfiltered.examBooking.updateMany({
          where: { 
            userId: res.userId, 
            OR: [
              { moduleCode: { equals: normModule, mode: 'insensitive' } },
              { moduleCode: { contains: normModule, mode: 'insensitive' } }
            ]
          },
          data: { 
            ...(data.attemptType ? { attemptType: data.attemptType } : {}),
            ...(data.examCategory ? { examCategory: data.examCategory } : {}),
            ...(data.bookingType ? { bookingType: data.bookingType as BookingType } : {}),
          },
        })
      }
    } else {
      // For Booking updates which might sync to Result, use a transaction with higher timeout
      // Determine isResit based on attemptType if not explicitly provided
      const isResit = data.isResit !== undefined 
        ? data.isResit 
        : (data.attemptType ? data.attemptType.startsWith('RESIT') : undefined)

      await prismaUnfiltered.$transaction(async (tx) => {
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
            ...(data.examCategory ? { examCategory: data.examCategory as ExamCategory } : {}),
            ...(isResit !== undefined ? { isResit } : {}),
            ...(data.bookingType ? { bookingType: data.bookingType as BookingType } : {}),
            // If formalizing (setting attemptType, score, or category), set result based on score
            // Guard: skip this when explicitly setting isMigrated to avoid collision
            ...(!data.isMigrated && (score !== undefined || data.attemptType || data.examCategory || (booking.result?.toUpperCase().includes('MIGRATE') && booking.score != null)) ? { 
              score: score ?? (booking.score != null ? Number(booking.score) : undefined),
              percentage: score ?? (booking.score != null ? Number(booking.score) : undefined),
              result: (score ?? (booking.score != null ? Number(booking.score) : 0)) >= 75 ? 'pass' : 'fail',
              status: PaymentStatus.APPROVED
            } : {}),
            // isMigrated takes final priority over the formalization result
            ...(data.isMigrated !== undefined ? { 
              result: data.isMigrated ? 'MIGRATED' : (booking.result === 'MIGRATED' ? 'pass' : booking.result)
            } : {}),
          },
        })

        // If score or attemptType is provided, sync to ExamResult
        if (score !== undefined || data.attemptType !== undefined || data.examCategory !== undefined) {
          if (data.resultIdToSync) {
             // We know exactly which ExamResult belongs to this booking
             await tx.examResult.update({
               where: { id: data.resultIdToSync },
               data: { 
                  ...(score !== undefined ? { score, maxScore: 100, percentage, passed, grade } : {}),
                  attemptType: data.attemptType || booking.attemptType,
                  examCategory: (data.examCategory as ExamCategory) || booking.examCategory,
                 moduleCode: finalModule,
                 migrationRef: data.isMigrated !== undefined 
                    ? (data.isMigrated ? (data.migrationRef || 'MANUAL_CORRECTION') : null)
                    : undefined
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
                data: { 
                  ...(score !== undefined ? { score, maxScore: 100, percentage, passed, grade } : {}),
                  attemptType: data.attemptType || booking.attemptType,
                  examCategory: (data.examCategory as ExamCategory) || booking.examCategory,
                  migrationRef: data.isMigrated !== undefined 
                    ? (data.isMigrated ? (data.migrationRef || 'MANUAL_CORRECTION') : null)
                    : undefined
                },
              })
            } else {
              await tx.examResult.create({
                data: {
                  userId: booking.userId,
                  moduleCode: finalModule,
                    score: score ?? 0,
                    maxScore: 100,
                    percentage: score ?? 0,
                    passed: (score ?? 0) >= 75,
                    grade: grade || 'F',
                    attemptType: data.attemptType || booking.attemptType,
                    examCategory: (data.examCategory as ExamCategory) || booking.examCategory,
                    migrationRef: data.isMigrated ? (data.migrationRef || 'MANUAL_CORRECTION') : undefined,
                  sourceNotes: 'Auto-created from booking update',
                },
              })
            }
          }
          
          if (score !== undefined) {
            // Default attendance to PRESENT since there is an exam record score
            await tx.examAttendance.upsert({
              where: { bookingId: actualId },
              update: { status: 'PRESENT' },
              create: {
                userId: booking.userId,
                bookingId: actualId,
                status: 'PRESENT',
                attendanceDate: booking.examDate || new Date(),
                recordedBy: 'system',
                eventId: booking.eventId,
                examId: booking.examId,
                examComponentId: booking.examComponentId,
                classId: booking.courseId ? undefined : undefined, // skip complex class resolution here
              }
            })
          }
        }
      }, {
        timeout: 30000 // Increase timeout to 30s to handle slow DB connections (P2028 fix)
      })
    }

    // Get userId and name for revalidation and audit log
    let targetUserId = ''
    let targetStudentName = 'unknown'
    if (isResultId) {
      const res = await prismaUnfiltered.examResult.findUnique({ where: { id: actualId }, select: { userId: true } })
      targetUserId = res?.userId || ''
    } else {
      const b = await prismaUnfiltered.examBooking.findUnique({ where: { id: actualId }, select: { userId: true } })
      targetUserId = b?.userId || ''
    }
    if (targetUserId) {
      const profile = await prismaUnfiltered.profile.findUnique({ where: { userId: targetUserId }, select: { firstName: true, lastName: true } })
      if (profile) targetStudentName = `${profile.firstName} ${profile.lastName}`
    }

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    if (targetUserId) {
      revalidatePath(`/staff/students/${targetUserId}`)
    }

    await createAuditLog({
      userId: staff.id,
      action: AuditAction.UPDATE,
      entity: isResultId ? 'ExamResult' : 'ExamBooking',
      entityId: actualId,
      description: `Updated ${isResultId ? 'exam result' : 'exam booking'} record for student ${targetStudentName}.`,
      changes: {
        recordId,
        targetUserId,
        fields: Object.keys(data),
        moduleCode,
        score,
        result: data.result,
        status: data.status,
        attemptType: data.attemptType,
        examCategory: data.examCategory,
      },
    })
    
    return { success: true }
  } catch (error) {
    return { error: handleActionError('updateExamResult', error, 'Failed to update record.') }
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
  examCategory?: 'INTERNAL' | 'OFFICIAL_EASA'
  notes?: string
  isPending?: boolean
  entries: { 
    courseId?: string; 
    examComponentId?: string; 
    moduleCode: string; 
    score?: number;
    resultOverride?: string;
  }[]
}) {
  try {
    const staff = await requireStaff()
    const { userId, bookingType, examDate, attemptType, examCategory, notes, entries, isPending } = data

    // Verify user exists
    const user = await prismaUnfiltered.user.findUnique({ where: { id: userId } })
    if (!user) return { error: 'Student not found.' }

    const bookingGroupRef = entries.length > 1 ? `STAFF_MANUAL_${Date.now()}` : undefined
    const affectedBookingIds: string[] = []

    await prismaUnfiltered.$transaction(async (tx) => {
      for (const entry of entries) {
        let finalModuleCode = entry.moduleCode.toUpperCase().trim()
        if (entry.courseId && !entry.moduleCode) {
          const course = await tx.course.findUnique({ where: { id: entry.courseId } })
          if (course) finalModuleCode = course.code.toUpperCase().trim()
        }

        const targetAttemptType = attemptType || 'FIRST'
        
        // Resolve result + status
        let result: string | undefined
        let percentage: number | undefined

        if (isPending) {
          result = undefined
          percentage = undefined
        } else if (entry.resultOverride && entry.resultOverride !== 'auto') {
          result = entry.resultOverride
          if (entry.score !== undefined) percentage = entry.score
        } else if (entry.score !== undefined) {
          percentage = entry.score
          result = entry.score >= 75 ? 'pass' : 'fail'
        }

        const bookingStatus = isPending ? PaymentStatus.PENDING : PaymentStatus.APPROVED

        // UPSERT Booking
        const existingBooking = await tx.examBooking.findFirst({
          where: {
            userId,
            moduleCode: finalModuleCode,
            attemptType: targetAttemptType,
            deletedAt: null,
          }
        })

        let finalBookingId = existingBooking?.id

        if (existingBooking) {
          await tx.examBooking.update({
            where: { id: existingBooking.id },
            data: {
              courseId: entry.courseId || existingBooking.courseId,
              examComponentId: entry.examComponentId || existingBooking.examComponentId,
              examDate: new Date(examDate),
              status: bookingStatus,
              result,
              score: entry.score ?? existingBooking.score,
              percentage: percentage ?? existingBooking.percentage,
              examCategory: examCategory || existingBooking.examCategory,
              bookingGroupRef: bookingGroupRef || existingBooking.bookingGroupRef,
            }
          })
          affectedBookingIds.push(existingBooking.id)
        } else {
          const newBooking = await tx.examBooking.create({
            data: {
              userId,
              courseId: entry.courseId,
              examComponentId: entry.examComponentId,
              moduleCode: finalModuleCode,
              examDate: new Date(examDate),
              amountPaid: 0,
              status: bookingStatus,
              bookingType,
              attemptType: targetAttemptType,
              result,
              score: entry.score,
              percentage,
              examCategory: examCategory || 'OFFICIAL_EASA',
              bookingGroupRef,
            }
          })
          finalBookingId = newBooking.id
          affectedBookingIds.push(newBooking.id)
        }

        if (entry.score !== undefined && finalBookingId) {
          await tx.examAttendance.upsert({
            where: { bookingId: finalBookingId },
            update: { status: 'PRESENT' },
            create: {
              userId,
              bookingId: finalBookingId,
              status: 'PRESENT',
              attendanceDate: new Date(examDate),
              recordedBy: staff.id,
            }
          })
        }

        // UPSERT Result
        if (result && ['pass', 'fail'].includes(result)) {
          const scoreVal = entry.score ?? (result === 'pass' ? 75 : 0)
          const grade = (percentage ?? 0) >= 90 ? 'A' : (percentage ?? 0) >= 80 ? 'B' : (percentage ?? 0) >= 75 ? 'C' : 'F'
          
          const existingResult = await tx.examResult.findFirst({
            where: { userId, moduleCode: finalModuleCode, attemptType: targetAttemptType }
          })

          if (existingResult) {
            await tx.examResult.update({
              where: { id: existingResult.id },
              data: {
                score: scoreVal,
                percentage,
                passed: result === 'pass',
                grade,
                examCategory: examCategory || 'OFFICIAL_EASA',
                sourceNotes: notes || 'Manually updated by staff',
              }
            })
          } else {
            await tx.examResult.create({
              data: {
                userId,
                moduleCode: finalModuleCode,
                score: scoreVal,
                maxScore: 100,
                percentage,
                passed: result === 'pass',
                grade,
                attemptType: targetAttemptType,
                examCategory: examCategory || 'OFFICIAL_EASA',
                sourceNotes: notes || 'Manually added by staff',
              }
            })
          }
        }
      }
    })

    revalidatePath('/staff/exams')
    revalidatePath('/student/exams')
    revalidatePath(`/staff/students/${userId}`)
    revalidatePath(`/staff/users/${userId}`)
    revalidatePath('/staff/reports')

    const studentProfile = await prismaUnfiltered.profile.findUnique({ where: { userId }, select: { firstName: true, lastName: true } })
    const studentName = studentProfile ? `${studentProfile.firstName} ${studentProfile.lastName}` : user.email

    await createAuditLog({
      userId: staff.id,
      action: AuditAction.CREATE,
      entity: 'ExamBooking',
      entityId: affectedBookingIds[0],
      description: `Created or updated ${affectedBookingIds.length} manual exam record(s) for student ${studentName}.`,
      changes: {
        studentId: userId,
        bookingIds: affectedBookingIds,
        bookingType,
        attemptType: attemptType || 'FIRST',
        examCategory: examCategory || 'OFFICIAL_EASA',
        isPending: Boolean(isPending),
        moduleCodes: entries.map((entry) => entry.moduleCode?.toUpperCase().trim()).filter(Boolean),
      },
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('createExamRecord', error, 'Failed to create record.') }
  }
}

/**
 * Deletes an ExamResult record (Records tab).
 */
export async function deleteExamRecord(id: string) {
  try {
    const staff = await requireStaff()

    const actualId = id.replace('result_', '')
    const isResultId = id.startsWith('result_')
    const existing = isResultId
      ? await prismaUnfiltered.examResult.findUnique({ where: { id: actualId } })
      : await prismaUnfiltered.examBooking.findUnique({ where: { id: actualId } })

    if (isResultId) {
      await prismaUnfiltered.examResult.delete({ where: { id: actualId } })
    } else {
      await prismaUnfiltered.examBooking.delete({ where: { id: actualId } })
    }

    revalidatePath('/staff/exams', 'page')
    revalidatePath('/staff/reports', 'page')
    await createAuditLog({
      userId: staff.id,
      action: AuditAction.DELETE,
      entity: isResultId ? 'ExamResult' : 'ExamBooking',
      entityId: actualId,
      description: `Deleted ${isResultId ? 'exam result' : 'exam booking'} record ${actualId}.`,
      changes: existing || { id: actualId },
    })
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

    const users = await prismaUnfiltered.user.findMany({
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
    handleActionError('searchStudents', error, 'Failed to search students.')
    return { students: [] }
  }
}

/**
 * Fetches all active courses/modules to populate the dropdown.
 */
export async function getAvailableModules() {
  try {
    await requireStaff()
    const courses = await prismaUnfiltered.course.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    })
    const components = await prismaUnfiltered.examComponent.findMany({
      select: { 
        id: true, 
        code: true, 
        name: true, 
        type: true,
        courseId: true,
        course: { select: { code: true, name: true } }
      },
      orderBy: { code: 'asc' },
    })
    
    const courseOptions = courses.map(c => ({
      id: c.id, // Using course ID here
      courseId: c.id,
      code: c.code,
      name: `${c.code}: ${c.name} (General)`,
      moduleCode: c.code,
      isComponent: false
    }))

    const componentOptions = components.map(c => ({
      id: c.id, // Using component ID here
      courseId: c.courseId,
      code: c.code,
      name: `${c.course.code}: ${c.name} (${c.type})`,
      moduleCode: c.course.code,
      isComponent: true
    }))
    
    return [...courseOptions, ...componentOptions].sort((a, b) => a.code.localeCompare(b.code))
  } catch (error) {
    handleActionError('getAvailableModules', error, 'Failed to load modules.')
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
    return { error: handleActionError('updateRevenueTarget', error, 'Failed to update target.') }
  }
}

/**
 * Bulk updates the exam category for multiple records.
 */
export async function bulkUpdateExamCategory(ids: string[], category: 'INTERNAL' | 'OFFICIAL_EASA') {

  try {
    await requireStaff()

    if (!ids || ids.length === 0) {

      return { error: 'No records selected' }
    }

    // Strip UI prefixes like 'result_'
    const cleanIds = ids.map(id => id.replace('result_', ''))


    // 1. Find all affected bookings and results
    const affectedBookings = await prismaUnfiltered.examBooking.findMany({
      where: { id: { in: cleanIds } },
      select: { id: true, userId: true, moduleCode: true }
    })

    const affectedResults = await prismaUnfiltered.examResult.findMany({
      where: { id: { in: cleanIds } },
      select: { id: true, userId: true, moduleCode: true }
    })



    // 2. Build a comprehensive list of all linked IDs
    const bookingIds = new Set(affectedBookings.map(b => b.id))
    const resultIds = new Set(affectedResults.map(r => r.id))

    // Collect all unique user/module pairs
    const pairs = new Set<string>()
    affectedBookings.forEach(b => {
      if (b.userId && b.moduleCode) pairs.add(`${b.userId}:${b.moduleCode.toUpperCase()}`)
    })
    affectedResults.forEach(r => {
      if (r.userId && r.moduleCode) pairs.add(`${r.userId}:${r.moduleCode.toUpperCase()}`)
    })



    // 3. Find all related records
    for (const pair of Array.from(pairs)) {
      const [uId, mCode] = pair.split(':')
      
      const relatedBookings = await prismaUnfiltered.examBooking.findMany({
        where: { 
          userId: uId, 
          moduleCode: { equals: mCode, mode: 'insensitive' } 
        },
        select: { id: true }
      })
      relatedBookings.forEach(b => bookingIds.add(b.id))

      const relatedResults = await prismaUnfiltered.examResult.findMany({
        where: { 
          userId: uId, 
          moduleCode: { equals: mCode, mode: 'insensitive' } 
        },
        select: { id: true }
      })
      relatedResults.forEach(r => resultIds.add(r.id))
    }



    // 4. Apply the update
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
    return { error: handleActionError('bulkUpdateExamCategory', error, 'Failed to update records.') }
  }
}

/**
 * Admin override for certificate / document release (audit gap 4c).
 * "or otherwise determined by admin" — force-releases official EASA certificates
 * and/or remaining FT-4Y second-half documents regardless of the pathway/funding
 * gate in lib/certificates/eligibility.ts.
 */
export async function setCertificateRelease(
  studentUserId: string,
  data: { certificatesReleased?: boolean; documentsReleased?: boolean }
) {
  try {
    const staff = await requireStaff()

    const profile = await prismaUnfiltered.studentProfile.findUnique({
      where: { userId: studentUserId },
      select: { id: true, certificatesReleased: true, documentsReleased: true },
    })
    if (!profile) return { error: 'Student profile not found.' }

    const now = new Date()
    const update: Record<string, unknown> = {}
    if (typeof data.certificatesReleased === 'boolean') {
      update.certificatesReleased = data.certificatesReleased
      update.certificatesReleasedAt = data.certificatesReleased ? now : null
      update.certificatesReleasedBy = data.certificatesReleased ? staff.id : null
    }
    if (typeof data.documentsReleased === 'boolean') {
      update.documentsReleased = data.documentsReleased
      update.documentsReleasedAt = data.documentsReleased ? now : null
      update.documentsReleasedBy = data.documentsReleased ? staff.id : null
    }
    if (Object.keys(update).length === 0) return { error: 'Nothing to update.' }

    await prismaUnfiltered.studentProfile.update({
      where: { id: profile.id },
      data: update,
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'StudentProfile',
      entityId: profile.id,
      userId: staff.id,
      description: `Updated certificate/document release for student ${studentUserId}.`,
      changes: { studentUserId, ...data },
    })

    revalidatePath(`/staff/students/${studentUserId}`)
    revalidatePath('/student/certificates')
    return { success: true }
  } catch (error) {
    return { error: handleActionError('setCertificateRelease', error, 'Failed to update certificate release settings.') }
  }
}

interface FetchApplicantsParams {
  tab?: string
  search?: string
  page?: string
  limit?: string
}

export async function fetchApplicants(params?: FetchApplicantsParams) {
  await requireStaff()

  const status = params?.tab ?? 'all'
  const search = params?.search ?? ''
  const page = parseInt(params?.page ?? '1', 10)
  const limit = parseInt(params?.limit ?? '25', 10)

  const where: Record<string, unknown> = {
    role: 'APPLICANT',
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { registrationCode: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  if (status === 'pending_payment') {
    ;(where as Record<string, unknown>).registrationPaid = false
    ;(where as Record<string, unknown>).status = 'PENDING'
  } else if (status === 'pending_approval') {
    ;(where as Record<string, unknown>).registrationPaid = true
    ;(where as Record<string, unknown>).status = 'PENDING'
  } else {
    ;(where as Record<string, unknown>).status = 'PENDING'
  }

  const [applicants, total, allCount, pendingPaymentCount, pendingApprovalCount] =
    await Promise.all([
      prismaUnfiltered.user.findMany({
        where,
        include: {
          profile: true,
          payments: {
            where: { referenceType: 'REGISTRATION' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prismaUnfiltered.user.count({ where }),
      prismaUnfiltered.user.count({ where: { role: 'APPLICANT', status: 'PENDING' } }),
      prismaUnfiltered.user.count({
        where: { role: 'APPLICANT', status: 'PENDING', registrationPaid: false },
      }),
      prismaUnfiltered.user.count({
        where: { role: 'APPLICANT', status: 'PENDING', registrationPaid: true },
      }),
    ])

  return {
    applicants: serializePrisma(applicants),
    meta: {
      total,
      page,
      limit,
      counts: {
        all: allCount,
        pending_payment: pendingPaymentCount,
        pending_approval: pendingApprovalCount,
      },
    },
  }
}

