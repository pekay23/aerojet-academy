import { describe, it, expect, vi } from 'vitest'

describe('lib/email/webhooks', () => {
  it('exports createResendWebhook', async () => {
    const { createResendWebhook } = await import('@/lib/email/webhooks')
    expect(typeof createResendWebhook).toBe('function')
  })

  it('exports getResendWebhook', async () => {
    const { getResendWebhook } = await import('@/lib/email/webhooks')
    expect(typeof getResendWebhook).toBe('function')
  })

  it('exports updateResendWebhook', async () => {
    const { updateResendWebhook } = await import('@/lib/email/webhooks')
    expect(typeof updateResendWebhook).toBe('function')
  })

  it('exports listResendWebhooks', async () => {
    const { listResendWebhooks } = await import('@/lib/email/webhooks')
    expect(typeof listResendWebhooks).toBe('function')
  })

  it('exports deleteResendWebhook', async () => {
    const { deleteResendWebhook } = await import('@/lib/email/webhooks')
    expect(typeof deleteResendWebhook).toBe('function')
  })
})
