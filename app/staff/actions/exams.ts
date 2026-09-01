'use server'

import { requireStaff, requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { BookingType, EnrollmentStatus, ExamCategory, PaymentStatus, UserStatus, UserRole } from '@prisma/client'
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
    return { error: handleActionError('bulkUpdateExamBookingStatus', error, 'Failed to update bookings.') }
  }
}

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
    certificateUrl?: string | null
    certificateIssued?: Date | null
    supervisorOverrideJustification?: string
  }
) {
  try {
    const staff = await requireStaff()
    const actualId = recordId.replace('result_', '')
    const isResultId = recordId.startsWith('result_')
    const isSupervisor = ['ADMIN', 'SUPER_ADMIN'].includes(staff.role)

    if (isResultId) {
      const existingResult = await prismaUnfiltered.examResult.findUnique({
        where: { id: actualId },
        select: { resultLocked: true, lockedBy: true, certificateUrl: true, certificateIssued: true },
      })

      if (existingResult?.resultLocked && !isSupervisor) {
        return { error: 'Result is locked and cannot be modified. Contact a supervisor for an override.' }
      }

      if (existingResult?.resultLocked && isSupervisor && !data.supervisorOverrideJustification?.trim()) {
        return { error: 'Supervisor override justification is required to modify a locked result.' }
      }
    }

    const moduleCode = data.moduleCode?.toUpperCase()
    const score = data.score !== undefined && data.score !== null ? data.score : undefined
    const percentage = score !== undefined ? score : undefined
    const passed = score !== undefined ? score >= 75 : undefined
    const grade = score !== undefined
      ? score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 75 ? 'C' : 'F'
      : undefined

    if (isResultId) {
      const updateData: Record<string, unknown> = {
        ...(moduleCode ? { moduleCode } : {}),
        ...(score !== undefined ? { score, maxScore: 100, percentage, passed, grade } : {}),
        ...(data.attemptType ? { attemptType: data.attemptType } : {}),
        ...(data.examCategory ? { examCategory: data.examCategory } : {}),
        ...(data.isMigrated !== undefined ? { 
          migrationRef: data.isMigrated ? (data.migrationRef || 'MANUAL_CORRECTION') : null 
        } : {}),
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
        where: { id: actualId },
        data: updateData,
      })

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
      const isResit = data.isResit !== undefined 
        ? data.isResit 
        : (data.attemptType ? data.attemptType.startsWith('RESIT') : undefined)

      await prismaUnfiltered.$transaction(async (tx) => {
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
            ...(!data.isMigrated && (score !== undefined || data.attemptType || data.examCategory || (booking.result?.toUpperCase().includes('MIGRATE') && booking.score != null)) ? { 
              score: score ?? (booking.score != null ? Number(booking.score) : undefined),
              percentage: score ?? (booking.score != null ? Number(booking.score) : undefined),
              result: (score ?? (booking.score != null ? Number(booking.score) : 0)) >= 75 ? 'pass' : 'fail',
              status: PaymentStatus.APPROVED
            } : {}),
            ...(data.isMigrated !== undefined ? { 
              result: data.isMigrated ? 'MIGRATED' : (booking.result === 'MIGRATED' ? 'pass' : booking.result)
            } : {}),
          },
        })

        if (score !== undefined || data.attemptType !== undefined || data.examCategory !== undefined) {
          if (data.resultIdToSync) {
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
                  examCategory: data.examCategory as ExamCategory || booking.examCategory,
                  migrationRef: data.isMigrated ? (data.migrationRef || 'MANUAL_CORRECTION') : undefined,
                  sourceNotes: 'Auto-created from booking update',
                },
              })
            }
          }
          
          if (score !== undefined) {
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
                classId: booking.courseId ? undefined : undefined,
              }
            })
          }
        }
      }, {
        timeout: 30000
      })
    }

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

    const ctx = await getRequestContext()
    await createAuditLog({
      userId: staff.id,
      action: AuditAction.UPDATE,
      entity: isResultId ? 'ExamResult' : 'ExamBooking',
      entityId: actualId,
      description: `Updated ${isResultId ? 'exam result' : 'exam booking'} record for student ${targetStudentName}.${isResultId && data.supervisorOverrideJustification ? ` Supervisor override: ${data.supervisorOverrideJustification}` : ''}`,
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
        resultLocked: isResultId ? (data.supervisorOverrideJustification ? false : undefined) : undefined,
        supervisorOverride: data.supervisorOverrideJustification || undefined,
        certificateUrl: data.certificateUrl,
        certificateIssued: data.certificateIssued?.toISOString?.() || data.certificateIssued,
      },
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    })
    return { success: true }
  } catch (error) {
    return { error: handleActionError('updateExamResult', error, 'Failed to update record.') }
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

    const ctx = await getRequestContext()
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
      id: c.id,
      courseId: c.id,
      code: c.code,
      name: `${c.code}: ${c.name} (General)`,
      moduleCode: c.code,
      isComponent: false
    }))

    const componentOptions = components.map(c => ({
      id: c.id,
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

export async function bulkUpdateExamCategory(ids: string[], category: 'INTERNAL' | 'OFFICIAL_EASA') {
  try {
    await requireStaff()

    if (!ids || ids.length === 0) {
      return { error: 'No records selected' }
    }

    const cleanIds = ids.map(id => id.replace('result_', ''))

    const affectedBookings = await prismaUnfiltered.examBooking.findMany({
      where: { id: { in: cleanIds } },
      select: { id: true, userId: true, moduleCode: true }
    })

    const affectedResults = await prismaUnfiltered.examResult.findMany({
      where: { id: { in: cleanIds } },
      select: { id: true, userId: true, moduleCode: true }
    })

    const bookingIds = new Set(affectedBookings.map(b => b.id))
    const resultIds = new Set(affectedResults.map(r => r.id))

    const pairs = new Set<string>()
    affectedBookings.forEach(b => {
      if (b.userId && b.moduleCode) pairs.add(`${b.userId}:${b.moduleCode.toUpperCase()}`)
    })
    affectedResults.forEach(r => {
      if (r.userId && r.moduleCode) pairs.add(`${r.userId}:${r.moduleCode.toUpperCase()}`)
    })

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
