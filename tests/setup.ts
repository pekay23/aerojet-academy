import { vi } from 'vitest'

// Mock next-auth
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
  SessionProvider: ({ children }: any) => children,
}))

// Mock prisma
vi.mock('@/lib/prisma/client', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
    },
    wallet: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    walletTransaction: { create: vi.fn(), findMany: vi.fn() },
    enrollment: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    examPool: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    poolMembership: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    profile: { create: vi.fn() },
    studentProfile: { create: vi.fn(), findFirst: vi.fn() },
    notification: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    systemSetting: { findUnique: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn((fn: any) =>
      fn({
        user: { findUnique: vi.fn(), update: vi.fn() },
        wallet: { findUnique: vi.fn(), update: vi.fn() },
        walletTransaction: { create: vi.fn() },
        poolMembership: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
        examPool: { findUnique: vi.fn(), update: vi.fn() },
        studentProfile: { create: vi.fn() },
        $queryRawUnsafe: vi.fn(),
      })
    ),
  },
}))

// Mock resend
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({ emails: { send: vi.fn(() => ({ data: { id: 'test' }, error: null })) } })),
}))
