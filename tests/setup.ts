import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Helper: create a model mock with common Prisma operations
// ---------------------------------------------------------------------------
function mockModel() {
  return {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  }
}

// ---------------------------------------------------------------------------
// Mock server-only (prevents "Cannot be imported from Client Component" in tests)
// ---------------------------------------------------------------------------
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: any) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock next-auth
// ---------------------------------------------------------------------------
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  SessionProvider: ({ children }: any) => children,
}))

// ---------------------------------------------------------------------------
// Mock Prisma — covers all production models
// ---------------------------------------------------------------------------
const prismaMock = {
  // Identity & Auth
  user: mockModel(),
  profile: mockModel(),
  account: mockModel(),
  session: mockModel(),
  passkey: mockModel(),

  // Student / Instructor / Staff profiles
  studentProfile: mockModel(),
  instructorProfile: mockModel(),
  staffProfile: mockModel(),

  // Finance
  wallet: mockModel(),
  walletTransaction: mockModel(),
  payment: mockModel(),
  invoice: mockModel(),
  paymentMilestone: mockModel(),
  tuitionRun: mockModel(),
  tuitionBooking: mockModel(),

  // Academic
  course: mockModel(),
  courseCategory: mockModel(),
  licenseCategory: mockModel(),
  licenseRequirement: mockModel(),
  studyPathwayModel: mockModel(),
  academicTerm: mockModel(),
  termCourseAssignment: mockModel(),
  academicYear: mockModel(),
  semester: mockModel(),
  programmeYear: mockModel(),

  // Enrollment
  enrollment: mockModel(),
  fullTimeEnrollment: mockModel(),
  modularEnrollment: mockModel(),

  // Classes & Grading
  class: mockModel(),
  classroom: mockModel(),
  classSession: mockModel(),
  grade: mockModel(),
  attendanceRecord: mockModel(),

  // Exams
  examEvent: mockModel(),
  examPool: mockModel(),
  examBooking: mockModel(),
  examResult: mockModel(),
  examBundle: mockModel(),
  examComponent: mockModel(),
  examSitting: mockModel(),
  examAttendance: mockModel(),
  sittingAssignment: mockModel(),
  bookingEntitlement: mockModel(),
  examExemption: mockModel(),
  poolMembership: mockModel(),
  poolWaitlist: mockModel(),

  // Notifications & Messages
  notification: mockModel(),
  message: mockModel(),
  emailTemplate: mockModel(),

  // Content & Files
  fileUpload: mockModel(),
  newsArticle: mockModel(),
  resource: mockModel(),
  adminCalendarEvent: mockModel(),

  // Settings & Audit
  systemSetting: mockModel(),
  auditLog: mockModel(),
  referral: mockModel(),
  adminNote: mockModel(),
  studentLicenseTarget: mockModel(),

  // Transaction helper
  $transaction: vi.fn((fn: any) => {
    if (typeof fn === 'function') {
      return fn(prismaMock)
    }
    return Promise.resolve(fn)
  }),
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  $executeRaw: vi.fn(),
  $executeRawUnsafe: vi.fn(),
}

vi.mock('@/lib/prisma/client', () => ({
  default: prismaMock,
  prismaUnfiltered: prismaMock,
}))

// ---------------------------------------------------------------------------
// Mock Resend
// ---------------------------------------------------------------------------
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: vi.fn(() => ({ data: { id: 'test' }, error: null })) },
  })),
}))

// ---------------------------------------------------------------------------
// Export for test files that need to configure mock return values
// ---------------------------------------------------------------------------
export { prismaMock }
