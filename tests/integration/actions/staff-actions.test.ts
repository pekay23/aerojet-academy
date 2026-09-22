import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import {
  getStaffRecipients,
  sendStaffMessage,
  markMessageAsRead,
  bulkUpdateUserStatus,
  searchStudents,
  getAvailableModules,
} from '@/app/staff/actions/index'

// Mock server-only and next/cache
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: (...args: never[]) => unknown) => fn,
}))

// Mock auth helpers
const mockRequireStaff = vi.fn()
vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: () => mockRequireStaff(),
  requireAdmin: vi.fn(),
}))

describe('Staff Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockRequireStaff.mockResolvedValue({ id: 'staff-1', email: 'staff@test.com' })
  })

  describe('getStaffRecipients', () => {
    it('returns active users excluding self', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          role: 'STUDENT',
          email: 'student@test.com',
          profile: { firstName: 'John', lastName: 'Doe', profilePhotoUrl: null },
        },
        {
          id: 'user-2',
          role: 'INSTRUCTOR',
          email: 'instructor@test.com',
          profile: { firstName: 'Jane', lastName: 'Smith', profilePhotoUrl: null },
        },
      ])

      const result = await getStaffRecipients()

      expect(result).toHaveLength(2)
      expect(result[0].label).toBe('John Doe (STUDENT)')
      expect(result[1].label).toBe('Jane Smith (INSTRUCTOR)')
    })

    it('returns empty array when user is not staff', async () => {
      mockRequireStaff.mockRejectedValue(new Error('Unauthorized'))

      const result = await getStaffRecipients()

      expect(result).toEqual([])
      expect(prismaMock.user.findMany).not.toHaveBeenCalled()
    })
  })

  describe('sendStaffMessage', () => {
    it('sends a message successfully', async () => {
      prismaMock.message.create.mockResolvedValue({
        id: 'msg-1',
        senderId: 'staff-1',
        recipientId: 'user-1',
        subject: 'Test',
        body: 'Hello',
        isRead: false,
      })

      const result = await sendStaffMessage('user-1', 'Test', 'Hello')

      expect(result.success).toBe(true)
      expect(prismaMock.message.create).toHaveBeenCalledWith({
        data: {
          senderId: 'staff-1',
          recipientId: 'user-1',
          subject: 'Test',
          body: 'Hello',
          isRead: false,
        },
      })
    })

    it('returns error when fields are missing', async () => {
      const result = await sendStaffMessage('', 'Test', '')

      expect(result.error).toBe('All fields are required.')
      expect(prismaMock.message.create).not.toHaveBeenCalled()
    })

    it('returns error on failure', async () => {
      prismaMock.message.create.mockRejectedValue(new Error('DB error'))

      const result = await sendStaffMessage('user-1', 'Test', 'Hello')

      expect(result.error).toBe('Failed to send message.')
    })
  })

  describe('markMessageAsRead', () => {
    it('marks message as read for the correct recipient', async () => {
      prismaMock.message.update.mockResolvedValue({
        id: 'msg-1',
        isRead: true,
        readAt: new Date(),
      })

      const result = await markMessageAsRead('msg-1')

      expect(result.success).toBe(true)
      expect(prismaMock.message.update).toHaveBeenCalledWith({
        where: { id: 'msg-1', recipientId: 'staff-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      })
    })

    it('returns error on failure', async () => {
      prismaMock.message.update.mockRejectedValue(new Error('DB error'))

      const result = await markMessageAsRead('msg-1')

      expect(result.error).toBe('Failed to mark message as read.')
    })
  })

  describe('bulkUpdateUserStatus', () => {
    it('updates multiple users status', async () => {
      prismaMock.user.updateMany.mockResolvedValue({ count: 3 })

      const result = await bulkUpdateUserStatus(['user-1', 'user-2', 'user-3'], 'ACTIVE')

      expect(result.success).toBe(true)
      expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['user-1', 'user-2', 'user-3'] } },
        data: { status: 'ACTIVE' },
      })
    })

    it('returns error for empty user list', async () => {
      const result = await bulkUpdateUserStatus([], 'ACTIVE')

      expect(result.error).toBe('Invalid parameters.')
      expect(prismaMock.user.updateMany).not.toHaveBeenCalled()
    })

    it('returns error when status is missing', async () => {
      const result = await bulkUpdateUserStatus(['user-1'], '' as any)

      expect(result.error).toBe('Invalid parameters.')
      expect(prismaMock.user.updateMany).not.toHaveBeenCalled()
    })
  })
})
