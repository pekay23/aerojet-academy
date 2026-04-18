import { Enrollment, Course, ExamBooking, Exam, ExamComponent, PoolMembership, ExamPool, PaymentMilestone, FullTimeEnrollment, FullTimeProgramme, ExamResult } from '@prisma/client'

/**
 * Serialized version of Prisma models for Client Components
 * Replaces Decimal with number and Date with string
 */

export interface SerializedCourse extends Omit<Course, 'createdAt' | 'updatedAt' | 'price' | 'duration'> {
  price?: number
  duration?: number
}

export interface SerializedEnrollment extends Omit<Enrollment, 'createdAt' | 'updatedAt' | 'enrolledAt' | 'approvedAt' | 'completedAt' | 'amountPaid'> {
  course: SerializedCourse
  amountPaid?: number
  enrolledAt: string
  approvedAt?: string | null
  completedAt?: string | null
}

export interface SerializedExamBooking extends Omit<ExamBooking, 'createdAt' | 'updatedAt' | 'examDate' | 'score' | 'percentage'> {
  exam: {
    id: string
    name: string
    duration: number
    examComponent?: {
      course?: {
        name: string
        code: string
      }
    }
  }
  event?: {
    location: string
  } | null
  examDate: string
  score?: number | null
  percentage?: number | null
}

export interface SerializedPaymentMilestone extends Omit<PaymentMilestone, 'dueDate' | 'paidAt' | 'amountDue' | 'percentOfYearFee'> {
  amountDue: number
  percentOfYearFee: number
  dueDate: string
  paidAt?: string | null
}

export interface StudentDashboardDTO {
  profile: {
    id: string
    pathwayName?: string
    licenseList: string
  }
  wallet: {
    available: number
    currency: string
  }
  upcomingExams: SerializedExamBooking[]
  enrollmentSummary: {
    isFullTime: boolean
    isExamOnly: boolean
    isFlexible: boolean
    ftEnrollment?: (FullTimeEnrollment & { programme: FullTimeProgramme }) | null
    ftMilestones: SerializedPaymentMilestone[]
    flexEnrollments: SerializedEnrollment[]
    ftCourseEnrollmentCount: number
  }
  latestResult: {
    module: string
    passed: boolean
    status: string
  } | null
}

export interface SerializedUserProfile {
  id: string
  email: string
  role: string
  profile?: {
    firstName: string
    lastName: string
    middleName?: string | null
    phone?: string | null
    address?: string | null
    dateOfBirth?: string | null
    profilePhotoUrl?: string | null
  } | null
  studentProfile?: {
    studentId?: string | null
    enrollmentType?: string | null
    enrollmentDate?: string | null
  } | null
  settings?: any
}

export interface UnifiedExamRecord {
  id: string
  type: 'ORIGINAL' | 'HISTORICAL'
  moduleCode: string
  moduleName: string
  date: Date
  passed?: boolean | null
  score?: number | null
  maxScore?: number | null
  percentage?: number | null
  grade?: string | null
  attemptType?: string | null
}
