import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { anonymiseUser } from '@/lib/gdpr/anonymise'

describe('anonymiseUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redacts user PII and marks as deleted', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'original@example.com',
      role: 'STUDENT',
      deletedAt: null,
    })
    prismaMock.user.update.mockResolvedValue({})
    prismaMock.profile.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.studentProfile.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.message.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.notification.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.passkey.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.studentDocument.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.fileUpload.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.auditLog.create.mockResolvedValue({})

    const result = await anonymiseUser('user-1', 'actor-1', 'GDPR request')

    expect(result.deleted).toBe(true)
    expect(result.redactedModels).toContain('user')
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        email: expect.stringContaining('deleted-'),
        deletedAt: expect.any(Date),
        status: 'DEACTIVATED',
      }),
    })
  })

  it('throws when user is not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    await expect(anonymiseUser('nonexistent', 'actor-1', 'test')).rejects.toThrow('User not found')
  })

  it('creates audit log with correct action', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'original@example.com',
      role: 'STUDENT',
      deletedAt: null,
    })
    prismaMock.user.update.mockResolvedValue({})
    prismaMock.profile.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.studentProfile.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.message.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.notification.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.passkey.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.studentDocument.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.fileUpload.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.auditLog.create.mockResolvedValue({})

    await anonymiseUser('user-1', 'actor-1', 'User request')

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'DELETE',
          userId: 'actor-1',
          entity: 'User',
          entityId: 'user-1',
          description: 'GDPR anonymisation: User request',
          changes: { redactedModels: expect.arrayContaining(['user']) },
        }),
      })
    )
  })

  it('redacts profile fields', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'original@example.com',
      role: 'STUDENT',
      deletedAt: null,
    })
    prismaMock.user.update.mockResolvedValue({})
    prismaMock.profile.updateMany.mockResolvedValue({ count: 1 })
    prismaMock.studentProfile.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.message.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.notification.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.passkey.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.studentDocument.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.fileUpload.updateMany.mockResolvedValue({ count: 0 })
    prismaMock.auditLog.create.mockResolvedValue({})

    await anonymiseUser('user-1', 'actor-1', 'test')

    expect(prismaMock.profile.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: expect.objectContaining({
        firstName: '[REDACTED]',
        lastName: '[REDACTED]',
        phone: null,
      }),
    })
  })
})
