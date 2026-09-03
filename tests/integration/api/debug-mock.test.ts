import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

describe('debug mock', () => {
  it('should mock checkRateLimit', async () => {
    vi.mock('@/lib/auth/helpers', () => ({
      getAuthSession: vi.fn(),
      requireStaff: vi.fn(),
      requireAdmin: vi.fn(),
      requireAuth: vi.fn(),
      hashPassword: vi.fn(),
      generateToken: vi.fn(),
      generateTempPassword: vi.fn(),
      generateAcademyEmail: vi.fn(),
      getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
      verifyPassword: vi.fn(),
      generateStudentId: vi.fn(),
      checkRateLimit: vi.fn().mockReturnValue(true),
      requireStudent: vi.fn(),
      requireInstructor: vi.fn(),
      requireApplicant: vi.fn(),
      requireAdminOrStaff: vi.fn(),
      requireExaminer: vi.fn(),
      generateRegistrationCode: vi.fn(),
    }))

    const { checkRateLimit } = await import('@/lib/auth/helpers')
    console.log('checkRateLimit:', checkRateLimit)
    console.log('is mock?', vi.isMockFunction(checkRateLimit))
    console.log('mock results:', (checkRateLimit as any).mock.results)
    expect(vi.isMockFunction(checkRateLimit)).toBe(true)
  })
})
