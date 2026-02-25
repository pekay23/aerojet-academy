import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBaseUrl } from '@/lib/utils/url'

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { headers } from 'next/headers'

describe('getBaseUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    vi.mocked(headers).mockReset()
  })

  it('returns URL from host header if available', async () => {
    vi.mocked(headers).mockResolvedValue(
      new Map([
        ['host', 'test.com'],
        ['x-forwarded-proto', 'https'],
      ]) as any
    )

    const url = await getBaseUrl()
    expect(url).toBe('https://test.com')
  })

  it('detects http for localhost even if proto missing', async () => {
    vi.mocked(headers).mockResolvedValue(new Map([['host', 'localhost:3000']]) as any)

    const url = await getBaseUrl()
    expect(url).toBe('http://localhost:3000')
  })

  it('falls back to NEXT_PUBLIC_APP_URL if headers fail', async () => {
    vi.mocked(headers).mockRejectedValue(new Error('Outside request context'))
    process.env.NEXT_PUBLIC_APP_URL = 'https://env-defined.com'

    const url = await getBaseUrl()
    expect(url).toBe('https://env-defined.com')
  })

  it('falls back to VERCEL_URL if NEXT_PUBLIC_APP_URL missing', async () => {
    vi.mocked(headers).mockRejectedValue(new Error('Outside request context'))
    delete process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_VERCEL_URL = 'project.vercel.app'

    const url = await getBaseUrl()
    expect(url).toBe('https://project.vercel.app')
  })

  it('defaults to localhost:3000 as absolute fallback', async () => {
    vi.mocked(headers).mockRejectedValue(new Error('Outside request context'))
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.NEXT_PUBLIC_VERCEL_URL
    delete process.env.VERCEL_URL

    const url = await getBaseUrl()
    expect(url).toBe('http://localhost:3000')
  })
})
