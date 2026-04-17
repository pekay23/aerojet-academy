// Standard API response types
import { DbUser, DbProfile, DbCourse, DbClass, DbEnrollment } from './database'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  success: false
  error: string
  details?: Record<string, string[]>
}

// Dashboard types
export interface StaffDashboardData {
  totalUsers: number
  totalStudents: number
  totalApplicants: number
  pendingPayments: number
  pendingEnrollments: number
  activeExamEvents: number
  recentActivity: AuditLogEntry[]
}

export interface StudentDashboardData {
  user: UserSafe
  wallet: WalletInfo | null
  enrollments: EnrollmentWithCourse[]
  poolMemberships: PoolMembershipWithDetails[]
  upcomingExams: ExamBookingWithDetails[]
  unreadNotifications: number
  attendanceRate: number
}

export interface InstructorDashboardData {
  user: UserSafe
  classes: ClassWithDetails[]
  upcomingClasses: ClassWithDetails[]
  totalStudents: number
  attendanceStats: { total: number; present: number; rate: number }
}

// Entity types (safe, no password)
export interface UserSafe extends Omit<DbUser, 'password'> {
  profile?: ProfileInfo | null
}

export interface ProfileInfo extends DbProfile {}

export interface WalletInfo {
  id: string
  userId: string
  balance: number
  reservedBalance: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface EnrollmentWithCourse extends DbEnrollment {
  course: Pick<DbCourse, 'code' | 'name' | 'duration'>
  grades?: GradeInfo[]
}

export interface GradeInfo {
  id: string
  type: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  remarks?: string | null
  createdAt: string
}

export interface PoolMembershipWithDetails {
  id: string
  poolId: string
  userId: string
  selectedModule: string
  status: string
  amountReserved: number
  amountPaid: number
  pool: {
    id: string
    name: string
    examDate: string
    status: string
    currentMemberCount: number
    event: { name: string }
  }
}

export interface ExamBookingWithDetails {
  id: string
  examId: string
  userId: string
  status: string
  exam: {
    id: string
    name: string
    date: string
    course?: { code: string; name: string }
  }
}

export interface ClassWithDetails extends DbClass {
  course: Pick<DbCourse, 'code' | 'name'>
}

export interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  userId?: string | null
  actorId?: string | null
  details?: Record<string, unknown>
  ipAddress?: string | null
  createdAt: string
}

export interface NotificationInfo {
  id: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  readAt?: string | null
  createdAt: string
}

export interface TransactionInfo {
  id: string
  walletId: string
  type: string
  amount: number
  description?: string | null
  reference?: string | null
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

// Report types
export interface EnrollmentReport {
  total: number
  byStatus: Record<string, number>
  byCourse: { courseCode: string; courseName: string; count: number }[]
  byMonth: { month: string; count: number }[]
}

export interface RevenueReport {
  totalPayments: number
  approvedRevenue: number
  pendingRevenue: number
  byType: Record<string, number>
  walletStats: { totalBalance: number; totalReserved: number }
}

export interface PoolReport {
  total: number
  byStatus: Record<string, number>
  averageMembers: number
  confirmedRevenue: number
  confirmedMemberCount: number
}
