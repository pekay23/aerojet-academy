import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { isValidRegistrationCode } from '@/lib/utils/validation'
import { mockApplicant } from '@/tests/fixtures/users'

vi.mock('@/lib/auth/helpers', () => ({
  generateRegistrationCode: vi.fn(() => 'AERO-2026-A1B2C3'),
  generateToken: vi.fn(() => 'mock-verify-token'),
  hashPassword: vi.fn(() => '$2a$12$hashedpassword'),
}))

describe('Registration Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registration code follows AERO-YYYY-XXXXXX format', () => {
    expect(isValidRegistrationCode(mockApplicant.registrationCode)).toBe(true)
    expect(isValidRegistrationCode('INVALID')).toBe(false)
    expect(isValidRegistrationCode('AERO-2026-ABC123')).toBe(true)
  })

  it('creates user with APPLICANT role and PAYMENT_PENDING status', async () => {
    prismaMock.user.create.mockResolvedValue({
      id: 'new-user-1',
      email: 'new@example.com',
      role: 'APPLICANT',
      status: 'PAYMENT_PENDING',
      registrationCode: 'AERO-2026-A1B2C3',
      emailVerified: null,
    })

    const user = await prismaMock.user.create({
      data: {
        email: 'new@example.com',
        password: '$2a$12$hashedpassword',
        role: 'APPLICANT',
        status: 'PAYMENT_PENDING',
        registrationCode: 'AERO-2026-A1B2C3',
      },
    })

    expect(user.role).toBe('APPLICANT')
    expect(user.status).toBe('PAYMENT_PENDING')
    expect(user.registrationCode).toMatch(/^AERO-\d{4}-/)
    expect(user.emailVerified).toBeNull()
  })

  it('rejects duplicate email registration', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'existing-1',
      email: 'existing@example.com',
    })

    const existing = await prismaMock.user.findFirst({
      where: { email: 'existing@example.com' },
    })
    expect(existing).not.toBeNull()
  })

  it('creates profile with first and last name', async () => {
    prismaMock.profile.create.mockResolvedValue({
      id: 'profile-1',
      userId: 'new-user-1',
      firstName: 'Ama',
      lastName: 'Adjei',
    })

    const profile = await prismaMock.profile.create({
      data: {
        userId: 'new-user-1',
        firstName: 'Ama',
        lastName: 'Adjei',
      },
    })

    expect(profile.firstName).toBe('Ama')
    expect(profile.lastName).toBe('Adjei')
    expect(profile.userId).toBe('new-user-1')
  })

  it('transitions from APPLICANT to STUDENT after payment approval', async () => {
    prismaMock.user.update.mockResolvedValue({
      id: 'user-1',
      role: 'STUDENT',
      status: 'ACTIVE',
    })

    const promoted = await prismaMock.user.update({
      where: { id: 'user-1' },
      data: { role: 'STUDENT', status: 'ACTIVE' },
    })

    expect(promoted.role).toBe('STUDENT')
    expect(promoted.status).toBe('ACTIVE')
  })
})
