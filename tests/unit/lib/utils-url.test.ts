import { describe, it, expect } from 'vitest'

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { getBaseUrl } from '@/lib/utils/url'
import { headers } from 'next/headers'

describe('lib/utils/url', () => {
  it('returns localhost fallback when no env vars', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn(() => null),
    } as any)

    process.env.NEXT_PUBLIC_APP_URL = ''
    process.env.NEXT_PUBLIC_VERCEL_URL = ''
    process.env.VERCEL_URL = ''

    const result = await getBaseUrl()
    expect(result).toBe('http://localhost:3000')
  })

  it('uses NEXT_PUBLIC_APP_URL when set', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn(() => null),
    } as any)

    process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com'
    process.env.NEXT_PUBLIC_VERCEL_URL = ''
    process.env.VERCEL_URL = ''

    const result = await getBaseUrl()
    expect(result).toBe('https://myapp.com')
  })

  it('strips trailing slash from NEXT_PUBLIC_APP_URL', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn(() => null),
    } as any)

    process.env.NEXT_PUBLIC_APP_URL = 'https://myapp.com/'
    process.env.NEXT_PUBLIC_VERCEL_URL = ''
    process.env.VERCEL_URL = ''

    const result = await getBaseUrl()
    expect(result).toBe('https://myapp.com')
  })

  it('uses VERCEL_URL when set', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn(() => null),
    } as any)

    process.env.NEXT_PUBLIC_APP_URL = ''
    process.env.NEXT_PUBLIC_VERCEL_URL = ''
    process.env.VERCEL_URL = 'my-vercel-app.vercel.app'

    const result = await getBaseUrl()
    expect(result).toBe('https://my-vercel-app.vercel.app')
  })
})
