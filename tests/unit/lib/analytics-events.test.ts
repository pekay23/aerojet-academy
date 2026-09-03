import { describe, it, expect, vi } from 'vitest'
import { validatePayload, trackEvent, trackPageView, trackFeatureUsage } from '@/lib/analytics/events'

// Mock prisma
vi.mock('@/lib/prisma/client', () => ({
  prismaUnfiltered: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  },
}))

describe('Analytics Events', () => {
  describe('validatePayload', () => {
    it('passes valid payload', () => {
      const result = validatePayload('PAGE_VIEW', { path: '/test' })
      expect(result).toEqual({ path: '/test' })
    })

    it('warns on missing required fields but still returns payload', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = validatePayload('PAGE_VIEW', {})
      expect(result).toEqual({})
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ANALYTICS] Missing required fields for PAGE_VIEW: path'
      )
      consoleSpy.mockRestore()
    })
  })

  describe('trackEvent', () => {
    it('creates audit log with correct structure', async () => {
      const { prismaUnfiltered } = await import('@/lib/prisma/client')
      const mockCreate = prismaUnfiltered.auditLog.create as any

      await trackEvent('FEATURE_USED', { feature: 'dashboard' }, 'user-123')

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          action: 'FEATURE_USED',
          entity: 'ANALYTICS',
          entityId: 'system',
          userId: 'user-123',
          changes: { feature: 'dashboard' },
        },
      })
    })

    it('does not throw on database errors', async () => {
      const { prismaUnfiltered } = await import('@/lib/prisma/client')
      const mockCreate = prismaUnfiltered.auditLog.create as any
      mockCreate.mockRejectedValueOnce(new Error('DB error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      await expect(trackEvent('PAGE_VIEW', { path: '/test' })).resolves.toBeUndefined()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('convenience wrappers', () => {
    it('trackPageView calls trackEvent with correct args', async () => {
      const { prismaUnfiltered } = await import('@/lib/prisma/client')
      const mockCreate = prismaUnfiltered.auditLog.create as any
      mockCreate.mockClear()

      await trackPageView('/test', 'user-1', 'https://google.com')

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          action: 'PAGE_VIEW',
          entity: 'ANALYTICS',
          entityId: 'system',
          userId: 'user-1',
          changes: { path: '/test', referrer: 'https://google.com' },
        },
      })
    })

    it('trackFeatureUsage calls trackEvent with correct args', async () => {
      const { prismaUnfiltered } = await import('@/lib/prisma/client')
      const mockCreate = prismaUnfiltered.auditLog.create as any
      mockCreate.mockClear()

      await trackFeatureUsage('search', 'query', 'user-1')

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          action: 'FEATURE_USED',
          entity: 'ANALYTICS',
          entityId: 'system',
          userId: 'user-1',
          changes: { feature: 'search', action: 'query' },
        },
      })
    })
  })
})
