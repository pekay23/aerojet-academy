import { ExamAttendanceStatus, Prisma, MembershipStatus } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import { resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'
import { createAuditLog } from '@/lib/audit/logger'
import { createNotification } from '@/lib/email/service'

export async function markExamAttendance(params: {
  membershipId?: string
  bookingId?: string
  sittingId?: string
  status: ExamAttendanceStatus
  notes?: string | null
  recordedBy: string
}) {
  const { membershipId, bookingId, sittingId, status, notes, recordedBy } = params

  if (!membershipId && !bookingId && !sittingId) {
    throw new Error('Must provide a membership, booking, or sitting reference')
  }

  return prisma.$transaction(
    async (tx) => {
      const sitting = sittingId
        ? await tx.examSitting.findUnique({
            where: { id: sittingId },
            select: {
              id: true,
              eventId: true,
              examComponentId: true,
              startTime: true,
            },
          })
        : null

      if (sittingId && !sitting) {
        throw new Error('Exam sitting not found')
      }

      const membership = membershipId
        ? await tx.poolMembership.findUnique({
            where: { id: membershipId },
            include: {
              pool: { select: { id: true, eventId: true, examDate: true } },
              examComponent: { select: { courseId: true } },
            },
          })
        : null

      if (membershipId && !membership) {
        throw new Error('Pool membership not found')
      }

      const sittingAssignment = sittingId
        ? await tx.examSittingAssignment.findFirst({
            where: {
              sittingId,
              ...(bookingId ? { bookingId } : {}),
              status: { in: ['ASSIGNED', 'CONFIRMED', 'ATTENDED', 'ABSENT', 'EXCUSED'] },
            },
            select: {
              id: true,
              bookingId: true,
              userId: true,
            },
            orderBy: { assignedAt: 'desc' },
          })
        : null

      const resolvedBookingId =
        bookingId || sittingAssignment?.bookingId || membership?.bookingId || undefined
      const booking = resolvedBookingId
        ? await tx.examBooking.findUnique({
            where: { id: resolvedBookingId },
            select: {
              id: true,
              userId: true,
              eventId: true,
              examId: true,
              examComponentId: true,
              courseId: true,
              examComponent: { select: { courseId: true } },
              examDate: true,
              result: true,
              score: true,
              percentage: true,
              status: true,
            },
          })
        : null

      if (resolvedBookingId && !booking) {
        throw new Error('Exam booking not found')
      }

      const userId = booking?.userId || membership?.userId || sittingAssignment?.userId
      if (!userId) {
        throw new Error('Unable to resolve exam-attendance student')
      }

      const attendanceDate =
        sitting?.startTime || booking?.examDate || membership?.pool.examDate || new Date()
      const normalizedNotes = notes?.trim() || null
      const courseId =
        booking?.courseId ||
        booking?.examComponent?.courseId ||
        membership?.examComponent?.courseId ||
        null

      const studentProfile = await tx.studentProfile.findUnique({
        where: { userId },
        select: {
          enrollmentType: true,
          programmeChoice: true,
          academicYearId: true,
          semesterId: true,
        },
      })

      const effectiveEnrollmentType = studentProfile
        ? resolveEffectiveEnrollmentType({
            enrollmentType: studentProfile.enrollmentType,
            programmeChoice: studentProfile.programmeChoice,
          })
        : null

      let classId: string | null = null
      if (courseId && effectiveEnrollmentType === 'FULL_TIME') {
        const linkedClass = await tx.class.findFirst({
          where: {
            courseId,
            ...(studentProfile?.academicYearId
              ? { academicYearId: studentProfile.academicYearId }
              : {}),
            ...(studentProfile?.semesterId ? { semesterId: studentProfile.semesterId } : {}),
          },
          select: { id: true },
          orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        })

        if (linkedClass) {
          classId = linkedClass.id
        } else {
          const fallbackClass = await tx.class.findFirst({
            where: { courseId },
            select: { id: true },
            orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
          })
          classId = fallbackClass?.id || null
        }
      }

      const payload = {
        userId,
        bookingId: booking?.id || null,
        membershipId: membership?.id || null,
        sittingId: sitting?.id || null,
        eventId: sitting?.eventId || booking?.eventId || membership?.pool.eventId || null,
        examId: booking?.examId || null,
        examComponentId:
          sitting?.examComponentId ||
          booking?.examComponentId ||
          membership?.examComponentId ||
          null,
        classId,
        attendanceDate,
        status,
        notes: normalizedNotes,
        recordedBy,
      }

      const attendance = booking?.id
        ? await tx.examAttendance.upsert({
            where: { bookingId: booking.id },
            update: payload,
            create: payload,
          })
        : await tx.examAttendance.upsert({
            where: { membershipId: membership!.id },
            update: payload,
            create: payload,
          })

      if (booking?.id) {
        if (status === ExamAttendanceStatus.PRESENT) {
          const currentResult = booking.result?.toUpperCase()
          await tx.examBooking.update({
            where: { id: booking.id },
            data: {
              status: booking.status === 'NO_SHOW' ? 'APPROVED' : booking.status,
              demandStatus: 'EXECUTED',
              executedAt: attendanceDate,
              // Clear any stale absence/excusal fields if re-marking present
              ...(currentResult === 'ABSENT' || currentResult === 'EXCUSED'
                ? {
                    result: null,
                    cancellationReason: null,
                    cancelledAt: null,
                    cancelledBy: null,
                  }
                : {}),
            },
          })
        } else if (status === ExamAttendanceStatus.ABSENT) {
          // Absent: seat is consumed but not passed — mark as no-show
          await tx.examBooking.update({
            where: { id: booking.id },
            data: {
              status: 'NO_SHOW',
              result: 'ABSENT',
              cancellationReason: 'Marked absent for exam attendance',
              cancelledAt: new Date(),
              cancelledBy: recordedBy,
            },
          })
        } else {
          // EXCUSED: the candidate did not sit but their paid guarantee is STILL OWED.
          // Do NOT mark as EXECUTED, do NOT set cancellation fields.
          // The booking stays SCHEDULED — fulfillment remains pending.
          await tx.examBooking.update({
            where: { id: booking.id },
            data: {
              result: 'EXCUSED',
              // Ensure any stale cancellation stamps are cleared
              cancellationReason: null,
              cancelledAt: null,
              cancelledBy: null,
            },
          })
        }
      }

      if (booking?.id && (sitting?.id || sittingAssignment?.id)) {
        await tx.examSittingAssignment.updateMany({
          where: {
            bookingId: booking.id,
            ...(sitting?.id ? { sittingId: sitting.id } : {}),
            status: { in: ['ASSIGNED', 'CONFIRMED', 'ATTENDED', 'ABSENT', 'EXCUSED'] },
          },
          data: {
            attendanceStatus: status,
            status:
              status === ExamAttendanceStatus.PRESENT
                ? 'ATTENDED'
                : status === ExamAttendanceStatus.ABSENT
                  ? 'ABSENT'
                  : 'EXCUSED',
          },
        })
      }

      if (membership?.id) {
        const membershipStatus =
          status === ExamAttendanceStatus.PRESENT
            ? 'CONFIRMED'
            : status === ExamAttendanceStatus.ABSENT
              ? 'NO_SHOW'
              : membership.status

        if (membership.status !== membershipStatus) {
          await tx.poolMembership.update({
            where: { id: membership.id },
            data: { status: membershipStatus as unknown as MembershipStatus },
          })
        }
      }

      // Audit log for attendance change
      await createAuditLog({
        userId: recordedBy,
        action: 'UPDATE',
        entity: 'ExamAttendance',
        entityId: attendance.id,
        description: `Marked exam attendance ${status} for user ${userId}${booking?.id ? ` on booking ${booking.id}` : ''}${membership?.id ? ` on membership ${membership.id}` : ''}`,
        changes: {
          status,
          bookingId: booking?.id,
          membershipId: membership?.id,
          sittingId: sitting?.id,
        },
      })

      // Notify student of attendance status
      if (userId && status === ExamAttendanceStatus.ABSENT) {
        await createNotification(prisma, userId, {
          type: 'EXAM_REMINDER',
          title: 'Exam Marked as Absent',
          message: `You were marked absent for the exam on ${attendanceDate.toLocaleDateString()}. Please contact the academy if this is incorrect.`,
          link: '/student/exams',
        }).catch((err) => console.error('[NOTIFICATION ERROR]', err))
      }

      return {
        attendance,
        bookingId: booking?.id || null,
        membershipId: membership?.id || null,
        sittingId: sitting?.id || null,
        eventId: sitting?.eventId || booking?.eventId || membership?.pool.eventId || null,
        userId,
        poolId: membership?.poolId || null,
      }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  )
}
