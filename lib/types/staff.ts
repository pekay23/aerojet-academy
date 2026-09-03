import type { UserRole, UserStatus, EnrollmentStatus } from '@/types/enums'

export interface SerializedProfile {
  firstName: string
  middleName: string | null
  lastName: string
  phone: string | null
  nationality: string | null
  dateOfBirth: string | null
  profilePhotoUrl: string | null
}

export interface SerializedStudentProfile {
  studentId: string | null
  enrollmentStatus: string
  enrollmentDate: string | null
  studyPathwayLocked: boolean
  studyPathwayLockedAt: string | null
  fundingSource: string | null
  currentYearNumber: number | null
  currentSemesterNumber: number | null
  programmeChoice: string | null
  enrollmentType: string | null
  certificatesReleased: boolean
  documentsReleased: boolean
  pathwayRel?: { code: string; name: string } | null
  academicYear?: { id: string; name: string } | null
  semester?: { id: string; name: string } | null
}

export interface SerializedWallet {
  availableBalance: number
  reservedBalance: number
  balance: number
  currency: string
}

export interface SerializedWalletTransaction {
  id: string
  type: string
  amount: number
  description: string | null
  referenceType: string | null
  referenceId: string | null
  proofUrl: string | null
  staffName: string | null
  balanceBefore: number | null
  balanceAfter: number | null
  reservedBefore: number | null
  reservedAfter: number | null
  availableBefore: number | null
  availableAfter: number | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface SerializedEnrollment {
  id: string
  status: string
  amountPaid: number | null
  enrolledAt: string
  completedAt: string | null
  course: {
    id: string
    code: string | null
    name: string
    price: number
  }
  user: {
    id: string
    email: string
    registrationFee: number
    profile: SerializedProfile | null
  }
}

export interface SerializedExamBooking {
  id: string
  moduleCode: string
  examDate: string | null
  score: number | null
  percentage: number | null
  result: string | null
  status: string
  bookingType: string | null
  attemptType: string | null
  examCategory: string | null
  amountPaid: number
  isResit: boolean
  eventName: string | null
  sittingLabel: string | null
  attendanceStatus: string | null
}

export interface SerializedExamResult {
  id: string
  moduleCode: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  attemptType: string | null
  sourceNotes: string | null
  certificateUrl: string | null
  examCategory: string | null
}

export interface SerializedExamBundle {
  id: string
  bundleType: string
  usedSeats: number
  totalSeats: number
  amountPaid: number
  status: string
  validUntil: string | null
}

export interface SerializedPayment {
  id: string
  amount: number
  currency: string
  status: string
  referenceType: string
  referenceCode: string | null
  paymentMethod: string | null
  approvedAt: string | null
  staffName: string | null
  createdAt: string
}

export interface SerializedExamComponent {
  id: string
  courseId: string
  code: string
  name: string
  moduleCode: string
  course?: { code: string; id: string } | null
}

export interface SerializedUpcomingEvent {
  id: string
  name: string
}

export interface SerializedAcademicYear {
  id: string
  name: string
}

export interface SerializedSemester {
  id: string
  name: string
}

export interface SerializedStudyPathway {
  id: string
  code: string
  name: string
}

export interface SerializedPracticalRecord {
  id: string
  date: string
  studentProfileId: string
  courseId: string
  taskCategory: string
  taskReference: string | null
  ataChapterId: string | null
  description: string
  deliveryMethod: string
  durationMinutes: number
  result: string | null
  signedByInstructor: boolean
  signedByStudent: boolean
  assessorNotes: string | null
  instructorId: string
  course: { id: string; code: string; name: string }
  ataChapter: { id: string; code: string; title: string } | null
  studentProfile: {
    id: string
    studentId: string
    user: { profile: { firstName: string; lastName: string } | null }
  }
  instructor: { id: string; profile: { firstName: string; lastName: string } | null }
}

export interface SerializedAtaChapter {
  id: string
  code: string
  title: string
}

export interface SerializedInstructor {
  id: string
  profile: { firstName: string; lastName: string } | null
}

export interface SerializedCourse {
  id: string
  code: string
  name: string
}

export interface SerializedStudent {
  id: string
  email: string
  personalEmail: string | null
  academyEmail: string | null
  role: UserRole
  status: UserStatus
  registrationCode: string | null
  registrationFee: number
  registrationCurrency: string
  registrationPaid: boolean
  paymentProofUrl: string | null
  paymentApprovedAt: string | null
  programmeChoice: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  profile: SerializedProfile | null
  studentProfile: SerializedStudentProfile | null
  instructorProfile: {
    employeeId: string
    department: string | null
    specialization: string | null
    qualifications: string | null
  } | null
  staffProfile: { employeeId: string; department: string | null } | null
  emailVerified: string | null
  wallet: SerializedWallet | null
  walletTransactions: SerializedWalletTransaction[]
  enrollments: SerializedEnrollment[]
  examBookings: SerializedExamBooking[]
  examResults: SerializedExamResult[]
  examBundles: SerializedExamBundle[]
  payments: SerializedPayment[]
  attendanceRecords: unknown[]
  fullTimeEnrollments: unknown[]
  modularEnrollments: unknown[]
  grades: unknown[]
  studentId?: string | null
  paymentApprovedBy?: string | null
  referralsReceived?: unknown[]
  referralsMade?: unknown[]
}

export interface SerializedOjtPeriod {
  id: string
  companyName: string
  companyAddress: string | null
  supervisorName: string | null
  status: string
  hoursCompleted: number
  hoursRequired: number
  startDate: string
  endDate: string | null
}

export interface SerializedFullTimeEnrollmentForOjt {
  id: string
  programme: { code: string; name: string }
  ojtPeriods: SerializedOjtPeriod[]
}

export interface SerializedPaymentCard {
  id: string
  amount: number
  paymentMethod: string
  referenceCode: string | null
  referenceType: string | null
  proofUrl: string | null
  createdAt: string
  user: {
    id: string
    email: string
    profile: { firstName: string; lastName: string } | null
  }
}

export interface MonthlyRevenueItem {
  month: string
  revenue: number
  count: number
}

export interface RevenueByProgrammeItem {
  name: string
  value: number
  percentage: number
}

export interface PaymentStatusBreakdownItem {
  status: string
  count: number
  amount: number
  percentage: number
}

export interface PaymentMethodBreakdownItem {
  method: string
  count: number
  amount: number
  percentage: number
}

export interface ExamHistoryItem {
  id: string
  source: 'result' | 'booking'
  type: string
  moduleCode: string
  examName: string
  date: string | Date | null
  score: number | null
  passed?: boolean
  result?: string | null
  examCategory?: string | null
  attemptType?: string | null
  paymentStatus?: string
  isConsolidated?: boolean
}

export interface ApplicantSummary {
  id: string
  email: string
  registrationCode?: string | null
  registrationPaid: boolean
  status: string
  createdAt: string
  profile?: {
    firstName: string
    middleName?: string | null
    lastName: string
    phone?: string | null
    nationality?: string | null
    dateOfBirth?: string | null
    idDocumentUrl?: string | null
    profilePhotoUrl?: string | null
  } | null
  payments?: any[]
}

export interface ApplicantCounts {
  all: number
  pending_payment: number
  pending_approval: number
  [key: string]: number
}

export interface SerializedTransactionRow {
  id: string
  type: string
  amount: number
  referenceType: string
  referenceId: string | null
  createdAt: string
  wallet: {
    user: {
      profile: { firstName: string; lastName: string } | null
      email: string
    }
  }
}

export interface SerializedTransactionRelated {
  payments: Array<{
    id: string
    reconciled: boolean
    paymentCurrency: string | null
    originalAmount: number | null
    status: string
  }>
  examBookings: Array<{
    id: string
    walletTxnId: string | null
    moduleCode: string | null
    result: string | null
    demandStatus: string | null
    status: string
  }>
  fullTimeEnrollments: Array<{
    id: string
    status: string
  }>
  modularEnrollments: Array<{
    id: string
    walletTxnId: string | null
    status: string
  }>
  milestones: Array<{
    id: string
    walletTxnId: string | null
    milestoneType: string
    status: string
  }>
}
