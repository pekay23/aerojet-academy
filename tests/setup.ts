import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// MUST BE FIRST: prevent real DB connections at module-evaluation time.
// db-base.ts creates a `pg.Pool` the moment it is imported, which opens a
// real TCP connection to Neon. Mock the entire module before anything else
// can import it, so the real Pool / PrismaClient is never instantiated.
// ---------------------------------------------------------------------------
vi.mock('pg', () => ({
  Pool: vi.fn(() => ({
    on: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
    connect: vi.fn(),
  })),
  Client: vi.fn(() => ({
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  })),
}))
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn(() => ({})),
}))
vi.mock('@prisma/adapter-neon', () => ({
  PrismaNeon: vi.fn(() => ({})),
}))

// ---------------------------------------------------------------------------
// Helper: create a model mock with common Prisma operations.
// `vi.fn()` is given a loose signature here so mockResolvedValueOnce /
// mockReturnValue etc. don't complain about argument arity for permissive
// mock shapes (Prisma's strict generic args don't matter for test mocks).
// ---------------------------------------------------------------------------
function mockModel(): Record<string, ReturnType<typeof vi.fn>> {
  const fn = (): ReturnType<typeof vi.fn> => vi.fn() as unknown as ReturnType<typeof vi.fn>
  return {
    findFirst: fn(),
    findUnique: fn(),
    findMany: fn(),
    create: fn(),
    createMany: fn(),
    update: fn(),
    updateMany: fn(),
    upsert: fn(),
    delete: fn(),
    deleteMany: fn(),
    count: fn(),
    aggregate: fn(),
    groupBy: fn(),
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
// Mock Prisma — covers all production models.
// We wrap with a Proxy so that any model name (including ones added later
// in the Prisma schema) returns a fresh mockModel() on access. This lets
// generated test files reference models that aren't explicitly enumerated
// below without triggering TS2339 "property does not exist" errors.
// ---------------------------------------------------------------------------
const prismaMockCore = {
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
  examiner: mockModel(),
  examSittingAssignment: mockModel(),
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
  retentionPolicy: mockModel(),

  // Finance — extended
  refund: mockModel(),
  withdrawalRequest: mockModel(),

  // Resources
  generalResource: mockModel(),

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

const prismaMock: any = new Proxy(prismaMockCore, {
  get(target, prop: string | symbol) {
    if (prop in target) return (target as any)[prop]
    if (typeof prop === 'symbol') return undefined
    const m = mockModel()
    ;(target as any)[prop] = m
    return m
  },
})

vi.mock('@/lib/prisma/client', () => ({
  default: prismaMock,
  prismaUnfiltered: prismaMock,
}))

vi.mock('@/lib/prisma/db-base', () => ({
  default: prismaMock,
  prismaBase: prismaMock,
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
