import { describe, it, expect } from 'vitest'

/**
 * Unit tests for proxy.ts hotlink protection logic.
 *
 * The proxy itself runs at the Next.js edge and cannot be invoked directly
 * from Vitest, so we extract the referer-check decision into a pure function
 * and test that. The route handlers (/api/images/*) are covered separately
 * in tests/integration/api/images-*.test.ts.
 */

function isHotlinkRequest(pathname: string, referer: string | null, host: string | null): boolean {
  const imageExtensions = /\.(webp|png|jpg|jpeg|gif|svg|avif)$/i
  if (!pathname.match(imageExtensions)) return false
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return false
  if (!referer || !host) return false

  try {
    const refererUrl = new URL(referer)
    const refererHost = refererUrl.hostname
    const hostName = host.split(':')[0] || ''
    if (refererHost === hostName || refererHost.endsWith('.' + hostName)) {
      return false
    }
    return true
  } catch {
    return false
  }
}

describe('proxy.ts hotlink protection', () => {
  it('allows requests with no referer', () => {
    expect(isHotlinkRequest('/images/photo.jpg', null, 'example.com')).toBe(false)
  })

  it('allows requests from same host', () => {
    expect(isHotlinkRequest('/images/photo.jpg', 'https://example.com/page', 'example.com')).toBe(false)
  })

  it('allows requests from subdomain', () => {
    expect(isHotlinkRequest('/images/photo.jpg', 'https://sub.example.com/page', 'example.com')).toBe(false)
  })

  it('blocks requests from different host', () => {
    expect(isHotlinkRequest('/images/photo.jpg', 'https://evil.com/steal', 'example.com')).toBe(true)
  })

  it('ignores non-image paths', () => {
    expect(isHotlinkRequest('/api/images/proxy', 'https://evil.com/steal', 'example.com')).toBe(false)
    expect(isHotlinkRequest('/_next/static/image.jpg', 'https://evil.com/steal', 'example.com')).toBe(false)
    expect(isHotlinkRequest('/favicon.ico', 'https://evil.com/steal', 'example.com')).toBe(false)
  })

  it('handles invalid referer gracefully', () => {
    expect(isHotlinkRequest('/images/photo.jpg', 'not-a-url', 'example.com')).toBe(false)
  })

  it('handles host with port', () => {
    expect(isHotlinkRequest('/images/photo.jpg', 'https://example.com:3000/page', 'example.com:3000')).toBe(false)
    expect(isHotlinkRequest('/images/photo.jpg', 'https://evil.com/page', 'example.com:3000')).toBe(true)
  })

  it('matches all image extensions', () => {
    const extensions = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'avif']
    for (const ext of extensions) {
      expect(isHotlinkRequest(`/images/photo.${ext}`, 'https://evil.com/steal', 'example.com')).toBe(true)
    }
  })
})
