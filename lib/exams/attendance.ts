import { ExamAttendanceStatus, Prisma } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import { resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'

export async function markExamAttendance(params: {
  membershipId?: string
  bookingId?: string
  status: ExamAttendanceStatus
  notes?: string | null
  recordedBy: string
}) {
  const { membershipId, bookingId, status, notes, recordedBy } = params

  if (!membershipId && !bookingId) {
    throw new Error('Must provide either membershipId or bookingId')
  }

  return prisma.$transaction(async (tx) => {
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

    const resolvedBookingId = bookingId || membership?.bookingId || undefined
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

    const userId = booking?.userId || membership?.userId
    if (!userId) {
      throw new Error('Unable to resolve exam-attendance student')
    }

    const attendanceDate = booking?.examDate || membership?.pool.examDate || new Date()
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
          ...(studentProfile?.academicYearId ? { academicYearId: studentProfile.academicYearId } : {}),
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
      eventId: booking?.eventId || membership?.pool.eventId || null,
      examId: booking?.examId || null,
      examComponentId: booking?.examComponentId || membership?.examComponentId || null,
      classId,
      attendanceDate,
      status,
      notes: normalizedNotes,
      recordedBy,
    }

    const attendance =
      booking?.id
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
        if ((currentResult === 'ABSENT' || currentResult === 'EXCUSED') && booking.score == null) {
          await tx.examBooking.update({
            where: { id: booking.id },
            data: {
              status: booking.status === 'NO_SHOW' ? 'APPROVED' : booking.status,
              result: null,
              cancellationReason: null,
              cancelledAt: null,
              cancelledBy: null,
            },
          })
        }
      } else {
        await tx.examBooking.update({
          where: { id: booking.id },
          data: {
            status: status === ExamAttendanceStatus.ABSENT ? 'NO_SHOW' : booking.status,
            result: status,
            cancellationReason:
              status === ExamAttendanceStatus.ABSENT
                ? 'Marked absent for exam attendance'
                : 'Marked excused for exam attendance',
            cancelledAt: new Date(),
            cancelledBy: recordedBy,
          },
        })
      }
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
          data: { status: membershipStatus as any },
        })
      }
    }

    return {
      attendance,
      bookingId: booking?.id || null,
      membershipId: membership?.id || null,
      userId,
      poolId: membership?.poolId || null,
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  })
}
