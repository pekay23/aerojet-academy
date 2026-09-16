import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFunnelMetrics, getCohortRetention, getFeatureAdoption, getPageViews, getUserJourney, __setPrisma } from '@/lib/analytics/queries'
import { prismaMock } from '@/tests/setup'

describe('Analytics Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    __setPrisma(prismaMock as any)
  })

  describe('getFunnelMetrics', () => {
    it('returns funnel steps with conversion rates', async () => {
      prismaMock.auditLog.count
        .mockResolvedValueOnce(100) // REGISTRATION_STARTED
        .mockResolvedValueOnce(80)  // REGISTRATION_COMPLETED
        .mockResolvedValueOnce(60)  // PAYMENT_SUBMITTED
        .mockResolvedValueOnce(50)  // PAYMENT_APPROVED

      const result = await getFunnelMetrics('registration')

      expect(result.name).toBe('registration')
      expect(result.steps).toHaveLength(4)
      expect(result.steps[0].count).toBe(100)
      expect(result.steps[1].count).toBe(80)
      expect(result.steps[1].conversionRate).toBe(80)
      expect(result.overallConversion).toBe(50)
    })
  })

  describe('getCohortRetention', () => {
    it('returns empty array when no users in cohort', async () => {
      prismaMock.user.findMany.mockResolvedValue([])

      const result = await getCohortRetention(new Date('2024-01-01'))
      expect(result).toEqual([])
    })
  })

  describe('getFeatureAdoption', () => {
    it('returns adoption metrics', async () => {
      prismaMock.user.count.mockResolvedValue(1000)
      prismaMock.auditLog.findMany.mockResolvedValue([
        { userId: 'user-1', createdAt: new Date() },
        { userId: 'user-2', createdAt: new Date() },
      ])

      const result = await getFeatureAdoption('dashboard')

      expect(result).not.toBeNull()
      expect(result!.adopters).toBe(2)
      expect(result!.adoptionRate).toBe(0) // 2/1000 rounded
      expect(result!.feature).toBe('dashboard')
    })
  })

  describe('getPageViews', () => {
    it('returns page view metrics', async () => {
      prismaMock.auditLog.groupBy.mockResolvedValue([
        { entityId: '/home', _count: { id: 100 } },
        { entityId: '/courses', _count: { id: 50 } },
      ])
      prismaMock.auditLog.findMany
        .mockResolvedValueOnce([{ userId: 'u1' }, { userId: 'u2' }])
        .mockResolvedValueOnce([{ userId: 'u3' }])

      const result = await getPageViews()

      expect(result).toHaveLength(2)
      expect(result[0].path).toBe('/home')
      expect(result[0].views).toBe(100)
      expect(result[0].uniqueVisitors).toBe(2)
    })
  })

  describe('getUserJourney', () => {
    it('returns ordered events for a user', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        {
          action: 'PAGE_VIEW',
          entity: 'ANALYTICS',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          changes: { path: '/home' },
        },
        {
          action: 'FEATURE_USED',
          entity: 'ANALYTICS',
          createdAt: new Date('2024-01-01T10:05:00Z'),
          changes: { feature: 'search' },
        },
      ])

      const result = await getUserJourney('user-123')

      expect(result).toHaveLength(2)
      expect(result[0].event).toBe('PAGE_VIEW') // mock returns in definition order
      expect(result[0].timestamp).toBe('2024-01-01T10:00:00.000Z')
    })
  })
})
