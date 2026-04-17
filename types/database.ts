// Database model types (mirrors Prisma schema for frontend use)
// Note: Dates are serialized to strings, and Decimals to numbers for frontend compatibility.

export interface DbUser {
  id: string
  email: string
  personalEmail?: string | null
  academyEmail?: string | null
  role: string
  status: string
  registrationCode?: string | null
  registrationFee: number
  registrationCurrency: string
  registrationPaid: boolean
  paymentProofUrl?: string | null
  paymentApprovedAt?: string | null
  paymentApprovedBy?: string | null
  programmeChoice?: string | null
  selectedLicenseCategories: string[]
  isAmbassador: boolean
  marketingOptOut: boolean
  referralCode?: string | null
  successfulReferrals: number
  mustChangePassword: boolean
  passwordChanged: boolean
  passwordChangedAt?: string | null
  emailVerified?: string | null
  loginAttempts: number
  lockedUntil?: string | null
  createdAt: string
  updatedAt: string
  lastLoginAt?: string | null
  deletedAt?: string | null
}

export interface DbProfile {
  id: string
  userId: string
  firstName: string
  lastName: string
  middleName?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  nationality?: string | null
  phone?: string | null
  alternatePhone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelation?: string | null
  profilePhotoUrl?: string | null // Renamed from photoUrl
  idDocumentUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface DbCourse {
  id: string
  code: string
  name: string
  description?: string | null
  subtitle?: string | null
  moduleType?: string | null
  duration?: number | null // Renamed from hours
  estimatedStudyHoursMin?: number | null
  estimatedStudyHoursMax?: number | null
  price: number
  currency: string
  isActive: boolean
  requiresPrerequisite: boolean
  prerequisites: string[]
  applicableCategories?: string[]
  topics: string[]
  hasCombinedExam: boolean
  syllabusUrl?: string | null
  materialsUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface DbCourseCategory {
  id: string
  name: string
  description: string | null
  courses: DbCourse[]
  _count: { courses: number }
}

export interface DbClass {
  id: string
  courseId: string
  instructorId?: string | null
  name: string // Added
  description?: string | null // Added
  academicYearId?: string | null
  semesterId?: string | null
  startDate: string // Renamed from date
  endDate: string // Added
  schedule?: any | null // Added
  maxStudents: number // Added
  currentStudents: number // Added
  createdAt: string
  updatedAt: string
}

export interface DbEnrollment {
  id: string
  userId: string
  courseId: string
  status: string
  academicYearId?: string | null
  semesterId?: string | null
  enrolledAt: string
  approvedAt?: string | null
  completedAt?: string | null
  amountPaid?: number | null
  paymentProofUrl?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}
