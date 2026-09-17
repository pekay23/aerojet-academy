import { cache } from 'react'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { resolveEffectiveEnrollmentType, resolveEffectivePathwayCode } from '@/lib/enrollment/pathway'

export type PaymentAccessLevel = 'FULL_ACCESS' | 'SEAT_ONLY' | 'RESTRICTED'

export type FeatureType = 'courses' | 'classes' | 'exams' | 'materials' | 'milestones' | 'pools' | 'wallet'

const FEATURE_ACCESS_MATRIX: Record<PaymentAccessLevel, FeatureType[]> = {
  FULL_ACCESS: ['courses', 'classes', 'exams', 'materials', 'milestones', 'pools', 'wallet'],
  SEAT_ONLY: ['milestones', 'pools'],
  RESTRICTED: ['milestones', 'pools'],
}

interface PrefetchedData {
  profile?: {
    enrollmentType?: string | null
    pathwayRel?: { code?: string | null } | null
  }
  enrollment?: {
    currentYearNumber?: number
    milestones?: Array<{
      id: string
      milestoneType: string
      yearNumber: number
      amountDue: unknown
      status: string
      dueDate: Date
      paidAt: Date | null
    }>
    programme?: { name?: string } | null
  } | null
}

export async function getStudentPaymentAccessLevel(
  userId: string,
  preFetchedData?: PrefetchedData
): Promise<PaymentAccessLevel> {
  const { isModular, isExamOnly } = await getStudentStatus(userId, preFetchedData?.profile)

  if (isModular || isExamOnly) {
    return 'FULL_ACCESS'
  }

  const ftEnrollment = preFetchedData?.enrollment || await prismaUnfiltered.fullTimeEnrollment.findFirst({
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

  const milestones = ftEnrollment.milestones || []
  
  const seatPaid = milestones.some(
    (m: { milestoneType: string; status: string }) => m.milestoneType === 'SEAT_CONFIRMATION' && m.status === 'PAID'
  )

  if (!seatPaid) {
    return 'RESTRICTED'
  }

  const sem1Paid = milestones.some(
    (m: { milestoneType: string; status: string }) => m.milestoneType === 'SEM1_DUE' && m.status === 'PAID'
  )

  if (!sem1Paid) {
    return 'SEAT_ONLY'
  }

  return 'FULL_ACCESS'
}

/**
 * Request-scoped student status resolver.
 * Wrapped in React.cache() so it is called at most ONCE per request,
 * even if multiple pages/components call it in parallel. This eliminates
 * the 3–5 redundant studentProfile DB queries per page load.
 */
export const getStudentStatus = cache(async (userId: string, preFetchedProfile?: {
  enrollmentType?: string | null
  pathwayRel?: { code?: string | null } | null
} | null) => {
  const profile = preFetchedProfile || await prismaUnfiltered.studentProfile.findUnique({
    where: { userId },
    select: {
      enrollmentType: true,
      pathwayRel: { select: { code: true } },
    },
  })

  const enrollmentType = profile?.enrollmentType
  const pathwayCode = profile?.pathwayRel?.code
  const effectiveCode = resolveEffectivePathwayCode({ enrollmentType, pathwayCode })
  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({ enrollmentType, pathwayCode })
  const isExamOnly = effectiveEnrollmentType === 'EXAM_ONLY'
  const isModular = effectiveEnrollmentType === 'MODULAR'
  const isFullTime = effectiveEnrollmentType === 'FULL_TIME'

  return {
    isFullTime,
    isExamOnly,
    isModular,
    enrollmentType: effectiveEnrollmentType,
    pathwayCode,
    effectiveCode,
  }
})

export async function canAccessFeature(userId: string, feature: FeatureType): Promise<boolean> {
  const accessLevel = await getStudentPaymentAccessLevel(userId)
  return FEATURE_ACCESS_MATRIX[accessLevel].includes(feature)
}

export async function getEnrollmentMilestoneStatus(
  userId: string,
  preFetchedData?: {
    profile?: {
      enrollmentType?: string | null
      pathwayRel?: { code?: string | null } | null
    }
    enrollment?: {
      currentYearNumber?: number
      milestones?: Array<{
        id: string
        milestoneType: string
        yearNumber: number
        amountDue: unknown
        status: string
        dueDate: Date
        paidAt: Date | null
      }>
      programme?: { name?: string } | null
    } | null
  }
) {
  const { isExamOnly, isModular } = await getStudentStatus(userId, preFetchedData?.profile)

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

  const ftEnrollment = preFetchedData?.enrollment || await prismaUnfiltered.fullTimeEnrollment.findFirst({
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

  const milestones = ftEnrollment.milestones || []

  const seatPaid = milestones.some(
    (m: { milestoneType: string; status: string }) => m.milestoneType === 'SEAT_CONFIRMATION' && m.status === 'PAID'
  )
  const sem1Paid = milestones.some(
    (m: { milestoneType: string; status: string }) => m.milestoneType === 'SEM1_DUE' && m.status === 'PAID'
  )
  const sem2Paid = milestones.some(
    (m: { milestoneType: string; status: string }) => m.milestoneType === 'SEM2_DUE' && m.status === 'PAID'
  )

  return {
    hasEnrollment: true,
    seatPaid,
    sem1Paid,
    sem2Paid,
    currentYear: (ftEnrollment.currentYearNumber as number | null) ?? null,
    programmeName: ftEnrollment.programme?.name || 'Full-Time Programme',
    milestones: milestones.map((m: {
      id: string
      milestoneType: string
      yearNumber: number
      amountDue: unknown
      status: string
      dueDate: Date
      paidAt: Date | null
    }) => ({
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
    (m: { status: string }) => m.status === 'DUE' || m.status === 'OVERDUE'
  )

  if (unpaidMilestones.length === 0) return null

  return unpaidMilestones.sort(
    (a: { dueDate: Date }, b: { dueDate: Date }) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )[0]
}
