import { z } from 'zod'

// ===========================================================================
// AUTH SCHEMAS
// ===========================================================================

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    middleName: z.string().max(50).optional(),
    email: z.string().email('Invalid email address'),
    nationality: z.string().min(2, 'Nationality is required'),
    dateOfBirth: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid date of birth')
      .refine((val) => {
        const dob = new Date(val)
        const today = new Date()
        return dob < today
      }, 'Date of birth cannot be in the future')
      .refine((val) => {
        const dob = new Date(val)
        const today = new Date()
        const age = today.getFullYear() - dob.getFullYear()
        const monthDiff = today.getMonth() - dob.getMonth()
        const dayDiff = today.getDate() - dob.getDate()
        const fullAge = monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0) ? age : age - 1
        return fullAge >= 16
      }, 'You must be at least 16 years old to register'),
    phoneCountryCode: z.string().min(1, 'Country code is required'),
    phone: z.string().min(7, 'Phone number is too short').max(15),
    selectedProgramme: z.enum(
      ['FULL_TIME_4YEAR', 'FULL_TIME_2YEAR', 'MILITARY_1YEAR', 'MODULAR', 'EXAM_ONLY'],
      {
        message: 'Please select a study pathway',
      }
    ),
    licenseCategories: z
      .array(z.string().min(1))
      .min(1, 'Please select at least one license category')
      .max(3, 'You can select up to 3 license categories')
      .optional(),
    referralCode: z.string().max(50).optional(),
  })
  .refine(
    (data) => {
      const requiresLicense = ['FULL_TIME_4YEAR', 'FULL_TIME_2YEAR', 'MILITARY_1YEAR'].includes(
        data.selectedProgramme
      )
      if (requiresLicense && (!data.licenseCategories || data.licenseCategories.length === 0)) {
        return false
      }
      return true
    },
    {
      message: 'License category selection is required for Full-Time and Military programmes',
      path: ['licenseCategories'],
    }
  )

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ===========================================================================
// USER SCHEMAS
// ===========================================================================

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'INSTRUCTOR', 'APPLICANT', 'STUDENT']),
})

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  personalEmail: z.string().email().optional(),
  firstName: z.string().min(2).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'STAFF', 'INSTRUCTOR', 'APPLICANT', 'STUDENT']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'DELETED']).optional(),
  programmeChoice: z.enum(['FULL_TIME_4YEAR', 'FULL_TIME_2YEAR', 'MILITARY_1YEAR', 'MODULAR', 'EXAM_ONLY']).optional(),
  selectedLicenseCategories: z.array(z.string()).optional(),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  gender: z.string().optional(),
  alternatePhone: z.string().optional(),
  postalCode: z.string().optional(),
  profilePhotoUrl: z.string().url().optional().or(z.literal('')),
})

// ===========================================================================
// COURSE SCHEMAS
// ===========================================================================

export const createCourseSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(20)
    .transform((val) => val.replace(/\s+/g, '')),
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  subtitle: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  moduleType: z.enum(['CORE', 'SPECIALIST', 'AVIONICS']).optional().nullable(),
  duration: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive(),
  currency: z.string().default('EUR'),
  isActive: z.boolean().default(true),
  requiresPrerequisite: z.boolean().default(false),
  prerequisites: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  estimatedStudyHoursMin: z.coerce.number().int().positive().optional().nullable(),
  estimatedStudyHoursMax: z.coerce.number().int().positive().optional().nullable(),
  applicableCategories: z.array(z.string()).optional(),
  hasCombinedExam: z.boolean().default(false),
  syllabusUrl: z.string().optional(),
  materialsUrl: z.string().optional(),
})

export const updateCourseSchema = createCourseSchema.partial()

// ===========================================================================
// CLASS SCHEMAS
// ===========================================================================

export const createClassSchema = z.object({
  courseId: z.string().cuid(),
  instructorId: z.string().cuid().optional(),
  name: z.string().min(1),
  schedule: z.any().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  description: z.string().optional(),
  academicYearId: z.string().optional(),
  semesterId: z.string().optional(),
  maxStudents: z.number().int().positive().default(28),
})

export const updateClassSchema = createClassSchema.partial()

// ===========================================================================
// EXAM EVENT SCHEMAS
// ===========================================================================

export const createExamEventSchema = z.object({
  name: z.string().min(2),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  joinDeadline: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid join deadline'),
  paymentDeadline: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid payment deadline'),
  minRevenueTarget: z.coerce.number().positive().default(25000.0),
  minRevenueCurrency: z.enum(['USD', 'EUR', 'GHS']).default('EUR'),
  location: z.string().optional(),
  resitFee: z.coerce.number().positive().default(480.0),
  resitFeeCurrency: z.enum(['USD', 'EUR', 'GHS']).default('EUR'),
  lateBookingSurcharge: z.coerce.number().nonnegative().default(50.0),
  lateBookingDays: z.coerce.number().int().nonnegative().default(14),
})

export const updateExamEventSchema = createExamEventSchema.partial()

export const createExamPoolSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1),
  examDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid exam date'),
  examStartTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start time'),
  examEndTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end time'),
  minCandidates: z.number().int().positive().default(25),
  maxCandidates: z.number().int().positive().default(28),
  moduleDiversityCap: z.number().int().positive().default(4),
  seatPrice: z.number().positive().default(300),
  allowedModules: z.array(z.string()).min(1).max(4),
  poolType: z.enum(['STANDARD', 'AUTO', 'GROUP_CHARTER']).default('STANDARD'),
  dayNumber: z.number().int().min(1).default(1),
  poolLabel: z.string().optional(),
  isAutoPool: z.boolean().default(false),
  venue: z.string().optional(),
  notes: z.string().optional(),
})

export const updateExamPoolSchema = createExamPoolSchema.partial()

export const studentCreatePoolSchema = z.object({
  eventId: z.string().cuid(),
  moduleCode: z.string().min(1, 'Module selection is required'),
  examDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid exam date'),
  examTimeSlot: z.enum(['MORNING', 'AFTERNOON']),
  bookingType: z.enum(['INDIVIDUAL_POOL', 'GROUP_CHARTER']).optional(),
  seats: z.number().int().min(1).max(28).optional(),
  organizationName: z.string().max(100).optional(),
})

export type CreatePoolInput = z.infer<typeof studentCreatePoolSchema>

// ===========================================================================
// POOL JOIN SCHEMA
// ===========================================================================

export const joinPoolSchema = z.object({
  selectedModule: z.string().min(1, 'Module selection is required'),
})

// ===========================================================================
// WALLET SCHEMAS
// ===========================================================================

export const walletTopUpSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  proofUrl: z.string().url('Valid proof URL required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export const approveTopUpSchema = z.object({
  notes: z.string().optional(),
})

// ===========================================================================
// PAYMENT SCHEMAS
// ===========================================================================

export const approvePaymentSchema = z.object({
  notes: z.string().optional(),
})

export const rejectPaymentSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
})

// ===========================================================================
// ENROLLMENT SCHEMAS
// ===========================================================================

export const createEnrollmentSchema = z.object({
  courseId: z.string().cuid(),
  paymentProofUrl: z.string().url().optional(),
})

export const approveEnrollmentSchema = z.object({
  notes: z.string().optional(),
})

// ===========================================================================
// ATTENDANCE SCHEMAS
// ===========================================================================

export const takeAttendanceSchema = z.object({
  date: z.string().datetime(),
  records: z.array(
    z.object({
      userId: z.string().cuid(),
      present: z.boolean(),
      lateMinutes: z.number().int().min(0).default(0),
      notes: z.string().optional(),
    })
  ),
})

// ===========================================================================
// GRADE SCHEMAS
// ===========================================================================

export const enterGradeSchema = z.object({
  enrollmentId: z.string().cuid(),
  type: z.enum(['QUIZ', 'MID_TERM', 'FINAL', 'ASSIGNMENT', 'PRACTICAL', 'EXAM']),
  title: z.string().min(1),
  grades: z.array(
    z.object({
      userId: z.string().cuid(),
      score: z.number().min(0),
      maxScore: z.number().positive(),
      mcqScore: z.number().min(0).optional(),
      essay1Score: z.number().min(0).optional(),
      essay2Score: z.number().min(0).optional(),
      feedback: z.string().optional(),
    })
  ),
})

// ===========================================================================
// PROFILE SCHEMAS
// ===========================================================================

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  middleName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
})

// ===========================================================================
// CONTACT SCHEMA
// ===========================================================================

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(10),
})

// ===========================================================================
// NEWS ARTICLE SCHEMAS
// ===========================================================================

export const newsArticleSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(10),
  coverImage: z.string().url().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  authorId: z.string().cuid(),
  customAuthorName: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  publishedAt: z.string().datetime().optional().nullable(),
  customPublishedAt: z.string().datetime().optional().nullable(),
})

export const updateNewsArticleSchema = newsArticleSchema.partial()

// ===========================================================================
// SETTINGS SCHEMA
// ===========================================================================

export const updateSettingSchema = z.object({
  value: z.any(),
  label: z.string().optional(),
})

// ===========================================================================
// HELPER
// ===========================================================================

export type ValidationResult<T> = { success: true; data: T } | { success: false; error: string }

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
    return { success: false, error: errors }
  }
  return { success: true, data: result.data }
}
