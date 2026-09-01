import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { buildUserDataExport } from '@/lib/gdpr/export'

describe('buildUserDataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns deep export with exportedAt and schemaVersion', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      profile: { firstName: 'Test' },
      studentProfile: {},
      staffProfile: null,
      instructorProfile: null,
      examinerProfile: null,
      wallet: { transactions: [] },
      enrollments: [],
      fullTimeEnrollments: [],
      modularEnrollments: [],
      examBookings: [],
      examResults: [],
      grades: [],
      attendanceRecords: [],
      messagesSent: [],
      messagesReceived: [],
      notificationsReceived: [],
      payments: [],
      invoices: [],
      refunds: [],
      withdrawalRequests: [],
      auditLogs: [],
      fileUploads: [],
      referralsMade: [],
      referralsReceived: [],
      studentDocuments: [],
      progressionLogs: [],
      passkeys: [],
    })

    const result = await buildUserDataExport('user-1')

    expect(result.exportedAt).toBeDefined()
    expect(result.schemaVersion).toBe(1)
    expect(result.user.id).toBe('user-1')
    expect(result.user.email).toBe('test@example.com')
  })

  it('throws when user is not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    await expect(buildUserDataExport('nonexistent')).rejects.toThrow('User not found')
  })

  it('includes related collections in the export', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      profile: { firstName: 'Test' },
      studentProfile: {},
      staffProfile: null,
      instructorProfile: null,
      examinerProfile: null,
      wallet: { transactions: [{ id: 't1' }] },
      enrollments: [{ id: 'e1' }],
      fullTimeEnrollments: [],
      modularEnrollments: [],
      examBookings: [{ id: 'b1' }],
      examResults: [{ id: 'r1' }],
      grades: [],
      attendanceRecords: [],
      messagesSent: [{ id: 'm1', subject: 'Hi' }],
      messagesReceived: [],
      notificationsReceived: [],
      payments: [{ id: 'p1' }],
      invoices: [],
      refunds: [],
      withdrawalRequests: [],
      auditLogs: [{ id: 'a1' }],
      fileUploads: [],
      referralsMade: [],
      referralsReceived: [],
      studentDocuments: [],
      progressionLogs: [],
      passkeys: [],
    })

    const result = await buildUserDataExport('user-1')

    expect(result.user.wallet.transactions).toHaveLength(1)
    expect(result.user.enrollments).toHaveLength(1)
    expect(result.user.examBookings).toHaveLength(1)
    expect(result.user.messagesSent).toHaveLength(1)
    expect(result.user.auditLogs).toHaveLength(1)
  })
})
