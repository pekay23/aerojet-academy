import { describe, it, expect, vi } from 'vitest'

describe('lib/email/service', () => {
  describe('createNotification', () => {
    it('creates notification with correct data', async () => {
      const mockTx = {
        notification: {
          create: vi.fn(() => Promise.resolve({ id: '1' })),
        },
      }

      const { createNotification } = await import('@/lib/email/service')
      const result = await createNotification(mockTx as any, 'user-1', {
        type: 'SUCCESS',
        title: 'Test',
        message: 'Test message',
        link: '/test',
      })

      expect(mockTx.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'SUCCESS',
          title: 'Test',
          message: 'Test message',
          link: '/test',
        },
      })
      expect(result.id).toBe('1')
    })
  })

  describe('wrapEmail', () => {
    it('wraps content in HTML email template', async () => {
      const { wrapEmail } = await import('@/lib/email/service')
      const result = await wrapEmail('Test Title', '<p>Hello</p>', 'test@example.com')
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<p>Hello</p>')
      expect(result).toContain('Test Title')
    })
  })
})
