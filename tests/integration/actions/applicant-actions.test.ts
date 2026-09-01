import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { updateApplicantProfile } from '@/app/applicant/actions'

// Mock server-only and next/cache
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth helpers
const mockRequireApplicant = vi.fn()
vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireApplicant: () => mockRequireApplicant(),
}))

describe('Applicant Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockRequireApplicant.mockResolvedValue({ id: 'applicant-1', email: 'applicant@test.com' })
  })

  describe('updateApplicantProfile', () => {
    it('returns error when first name is missing', async () => {
      const formData = new FormData()
      formData.append('lastName', 'Doe')

      const result = await updateApplicantProfile(formData)

      expect(result.error).toBe('First name and last name are required.')
      expect(prismaMock.profile.upsert).not.toHaveBeenCalled()
    })

    it('returns error when last name is missing', async () => {
      const formData = new FormData()
      formData.append('firstName', 'John')

      const result = await updateApplicantProfile(formData)

      expect(result.error).toBe('First name and last name are required.')
      expect(prismaMock.profile.upsert).not.toHaveBeenCalled()
    })

    it('creates a new profile when none exists', async () => {
      prismaMock.profile.upsert.mockResolvedValue({
        userId: 'applicant-1',
        firstName: 'John',
        lastName: 'Doe',
      })

      const formData = new FormData()
      formData.append('firstName', 'John')
      formData.append('lastName', 'Doe')
      formData.append('phone', '1234567890')
      formData.append('email', 'john@test.com')

      const result = await updateApplicantProfile(formData)

      expect(result.success).toBe(true)
      expect(prismaMock.profile.upsert).toHaveBeenCalledWith({
        where: { userId: 'applicant-1' },
        update: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          phone: '1234567890',
        }),
        create: expect.objectContaining({
          userId: 'applicant-1',
          firstName: 'John',
          lastName: 'Doe',
          phone: '1234567890',
        }),
      })
    })

    it('updates existing profile', async () => {
      prismaMock.profile.upsert.mockResolvedValue({
        userId: 'applicant-1',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '9876543210',
      })

      const formData = new FormData()
      formData.append('firstName', 'Jane')
      formData.append('lastName', 'Doe')
      formData.append('phone', '9876543210')

      const result = await updateApplicantProfile(formData)

      expect(result.success).toBe(true)
    })

    it('returns error on database failure', async () => {
      prismaMock.profile.upsert.mockRejectedValue(new Error('DB error'))

      const formData = new FormData()
      formData.append('firstName', 'John')
      formData.append('lastName', 'Doe')

      const result = await updateApplicantProfile(formData)

      expect(result.error).toBe('Failed to save profile. Please try again.')
    })
  })
})
