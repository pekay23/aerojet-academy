import { Prisma } from '@prisma/client'
import { 
  SerializedCourse, 
  SerializedEnrollment, 
  SerializedExamBooking, 
  SerializedPaymentMilestone,
  SerializedUserProfile
} from './types'

// Type definitions for Prisma objects with includes
type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    examComponents: { include: { course: true } }
  }
}>

type EnrollmentWithRelations = Prisma.EnrollmentGetPayload<{
  include: { course: true }
}>

type ExamBookingWithRelations = Prisma.ExamBookingGetPayload<{
  include: { 
    exam: { include: { examComponent: { include: { course: true } } } },
    event: true 
  }
}>

type PaymentMilestoneWithRelations = Prisma.PaymentMilestoneGetPayload<{}>

type UserWithProfile = Prisma.UserGetPayload<{
  select: {
    id: true,
    email: true,
    role: true,
    profile: true,
    studentProfile: true,
    settings: true,
  }
}>

export function serializeCourse(course: any): SerializedCourse {
  return {
    ...course,
    price: course.price ? Number(course.price) : undefined,
    duration: course.duration ? Number(course.duration) : undefined,
  }
}

export function serializeEnrollment(enrollment: EnrollmentWithRelations): SerializedEnrollment {
  return {
    ...enrollment,
    amountPaid: enrollment.amountPaid ? Number(enrollment.amountPaid) : undefined,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    approvedAt: enrollment.approvedAt?.toISOString() || null,
    completedAt: enrollment.completedAt?.toISOString() || null,
    course: serializeCourse(enrollment.course),
  }
}

export function serializeExamBooking(booking: ExamBookingWithRelations): SerializedExamBooking {
  return {
    ...booking,
    examDate: (booking.examDate || booking.createdAt).toISOString(),
    exam: {
      id: booking.exam?.id || 'historical',
      name: booking.exam?.name || 'Exam Record',
      duration: Number(booking.exam?.duration || 0),
      examComponent: booking.exam?.examComponent ? {
        course: booking.exam.examComponent.course ? {
          name: booking.exam.examComponent.course.name,
          code: booking.exam.examComponent.course.code,
        } : undefined
      } : undefined
    },
    event: booking.event ? {
      location: booking.event.location || 'Online',
    } : null,
  }
}

export function serializePaymentMilestone(milestone: PaymentMilestoneWithRelations): SerializedPaymentMilestone {
  return {
    ...milestone,
    amountDue: Number(milestone.amountDue),
    percentOfYearFee: Number(milestone.percentOfYearFee),
    dueDate: milestone.dueDate.toISOString(),
    paidAt: milestone.paidAt?.toISOString() || null,
  }
}

export function serializeUserProfile(user: UserWithProfile): SerializedUserProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.profile ? {
      ...(user.profile as any),
      dateOfBirth: (user.profile as any).dateOfBirth?.toISOString() || null,
      createdAt: undefined,
      updatedAt: undefined,
    } : null,
    studentProfile: user.studentProfile ? {
      ...(user.studentProfile as any),
      enrollmentDate: (user.studentProfile as any).enrollmentDate?.toISOString() || null,
      createdAt: undefined,
      updatedAt: undefined,
    } : null,
    settings: user.settings || {},
  }
}
