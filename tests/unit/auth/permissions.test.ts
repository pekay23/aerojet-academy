import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/auth-options', () => ({
  getAuthSession: vi.fn(),
}))

vi.mock('@/lib/instructor/profile', () => ({
  getInstructorProfileByUserId: vi.fn(),
}))

vi.mock('@/lib/auth/permission-registry', () => ({
  userHasPermission: vi.fn(),
}))

import { requireBankAccess } from '@/lib/auth/permissions'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { getAuthSession } from '@/lib/auth/auth-options'
import { userHasPermission } from '@/lib/auth/permission-registry'

const mockedGetProfile = vi.mocked(getInstructorProfileByUserId)
const mockedGetSession = vi.mocked(getAuthSession)
const mockedHasPermission = vi.mocked(userHasPermission)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('requireBankAccess', () => {
  it('allows ADMIN regardless of bank assignment', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } } as any)
    const result = await requireBankAccess('bank-1', 'canEdit')
    expect(result).toEqual({ id: 'u1', role: 'ADMIN' })
  })

  it('allows SUPER_ADMIN regardless of bank assignment', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'u2', role: 'SUPER_ADMIN' } } as any)
    const result = await requireBankAccess('bank-1', 'canReview')
    expect(result).toEqual({ id: 'u2', role: 'SUPER_ADMIN' })
  })

  it('allows instructor with canEdit=true on the bank', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'u3', role: 'INSTRUCTOR' } } as any)
    mockedGetProfile.mockResolvedValue({ id: 'inst-1' } as any)
    const prismaMock = (await import('@/lib/prisma/client')).prismaUnfiltered as any
    prismaMock.internalExamBankInstructor.findUnique.mockResolvedValue({ canEdit: true })

    const result = await requireBankAccess('bank-1', 'canEdit')
    expect(result).toEqual({ id: 'u3', role: 'INSTRUCTOR' })
    expect(prismaMock.internalExamBankInstructor.findUnique).toHaveBeenCalledWith({
      where: { bankId_instructorId: { bankId: 'bank-1', instructorId: 'inst-1' } },
      select: { canEdit: true },
    })
  })

  it('denies instructor without assignment (403)', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'u4', role: 'INSTRUCTOR' } } as any)
    mockedGetProfile.mockResolvedValue({ id: 'inst-2' } as any)
    const prismaMock = (await import('@/lib/prisma/client')).prismaUnfiltered as any
    prismaMock.internalExamBankInstructor.findUnique.mockResolvedValue(null)
    mockedHasPermission.mockResolvedValue(false)

    await expect(requireBankAccess('bank-1', 'canEdit')).rejects.toThrow(
      'Bank access denied: canEdit'
    )
  })

  it('falls back to global MANAGE_EXAMS permission when not assigned', async () => {
    mockedGetSession.mockResolvedValue({ user: { id: 'u5', role: 'STAFF' } } as any)
    mockedGetProfile.mockResolvedValue({ id: 'inst-3' } as any)
    const prismaMock = (await import('@/lib/prisma/client')).prismaUnfiltered as any
    prismaMock.internalExamBankInstructor.findUnique.mockResolvedValue(null)
    mockedHasPermission.mockResolvedValue(true)

    const result = await requireBankAccess('bank-1', 'canMonitor')
    expect(result).toEqual({ id: 'u5', role: 'STAFF' })
    expect(mockedHasPermission).toHaveBeenCalledWith('u5', 'STAFF', 'EXAM_SESSION_MONITOR')
  })
})
