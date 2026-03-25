import prisma from '@/lib/prisma/client'

export type PaymentAccessLevel = 'FULL_ACCESS' | 'SEAT_ONLY' | 'RESTRICTED'

export type FeatureType = 'courses' | 'classes' | 'exams' | 'materials' | 'milestones' | 'pools'

const FEATURE_ACCESS_MATRIX: Record<PaymentAccessLevel, FeatureType[]> = {
  FULL_ACCESS: ['courses', 'classes', 'exams', 'materials', 'milestones', 'pools'],
  SEAT_ONLY: ['milestones', 'pools'],
  RESTRICTED: ['milestones', 'pools'],
}

export async function getStudentPaymentAccessLevel(userId: string): Promise<PaymentAccessLevel> {
  const { isModular, isExamOnly } = await getStudentStatus(userId)

  if (isModular || isExamOnly) {
    return 'FULL_ACCESS'
  }

  const ftEnrollment = await prisma.fullTimeEnrollment.findFirst({
    where: { studentId: userId },
    include: {
      milestones: {
        where: { yearNumber: 1 },
      },
    },
  })

  if (!ftEnrollment) {
    return 'RESTRICTED'
  }

  const seatPaid = ftEnrollment.milestones.some(
    (m) => m.milestoneType === 'SEAT_CONFIRMATION' && m.status === 'PAID'
  )

  if (!seatPaid) {
    return 'RESTRICTED'
  }

  const sem1Paid = ftEnrollment.milestones.some(
    (m) => m.milestoneType === 'SEM1_DUE' && m.status === 'PAID'
  )

  if (!sem1Paid) {
    return 'SEAT_ONLY'
  }

  return 'FULL_ACCESS'
}

export async function getStudentStatus(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { 
      enrollmentType: true,
      pathwayRel: { select: { code: true } }
    },
  })

  const enrollmentType = profile?.enrollmentType
  const pathwayCode = profile?.pathwayRel?.code

  const isFullTime = enrollmentType === 'FULL_TIME' ||
                     !!(pathwayCode && ['FULL_TIME', 'FULL_TIME_4Y', 'FULL_TIME_2Y', 'MILITARY_2Y', 'MILITARY_1Y'].includes(pathwayCode))

  const isExamOnly = enrollmentType === 'EXAM_ONLY' || pathwayCode === 'EXAM_ONLY'
  const isModular = enrollmentType === 'MODULAR' || pathwayCode === 'MODULAR'

  return { isFullTime, isExamOnly, isModular, enrollmentType, pathwayCode }
}

export async function canAccessFeature(userId: string, feature: FeatureType): Promise<boolean> {
  const accessLevel = await getStudentPaymentAccessLevel(userId)
  return FEATURE_ACCESS_MATRIX[accessLevel].includes(feature)
}

export async function getEnrollmentMilestoneStatus(userId: string) {
  const { isExamOnly, isModular, enrollmentType, pathwayCode } = await getStudentStatus(userId)

  if (isModular || isExamOnly) {
    const label = isExamOnly ? 'Exam-Only Pathway' : 'Modular Programme'
    return {
      hasEnrollment: true,
      seatPaid: true,
      sem1Paid: true,
      sem2Paid: true,
      currentYear: null,
      programmeName: label,
      milestones: [],
    }
  }

  const ftEnrollment = await prisma.fullTimeEnrollment.findFirst({
    where: { studentId: userId },
    include: {
      programme: true,
      milestones: {
        orderBy: [{ yearNumber: 'asc' }, { dueDate: 'asc' }],
      },
    },
  })

  if (!ftEnrollment) {
    return {
      hasEnrollment: false,
      seatPaid: false,
      sem1Paid: false,
      sem2Paid: false,
      currentYear: null,
      programmeName: 'Full-Time Programme',
      milestones: [],
    }
  }

  const seatPaid = ftEnrollment.milestones.some(
    (m) => m.milestoneType === 'SEAT_CONFIRMATION' && m.status === 'PAID'
  )
  const sem1Paid = ftEnrollment.milestones.some(
    (m) => m.milestoneType === 'SEM1_DUE' && m.status === 'PAID'
  )
  const sem2Paid = ftEnrollment.milestones.some(
    (m) => m.milestoneType === 'SEM2_DUE' && m.status === 'PAID'
  )

  return {
    hasEnrollment: true,
    seatPaid,
    sem1Paid,
    sem2Paid,
    currentYear: ftEnrollment.currentYearNumber,
    programmeName: ftEnrollment.programme.name,
    milestones: ftEnrollment.milestones.map((m) => ({
      id: m.id,
      type: m.milestoneType,
      yearNumber: m.yearNumber,
      amountDue: Number(m.amountDue),
      status: m.status,
      dueDate: m.dueDate,
      paidAt: m.paidAt,
    })),
  }
}

export async function getNextDueMilestone(userId: string) {
  const status = await getEnrollmentMilestoneStatus(userId)

  if (!status.hasEnrollment) return null

  const unpaidMilestones = status.milestones.filter(
    (m) => m.status === 'DUE' || m.status === 'OVERDUE'
  )

  if (unpaidMilestones.length === 0) return null

  return unpaidMilestones.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )[0]
}
