import { describe, it, expect } from 'vitest'
import { proxyImageUrl, transformImageUrl } from '@/lib/storage/signed-url'

function parseQuery(url: string): Record<string, string> {
  const q = url.split('?')[1] ?? ''
  const params = new URLSearchParams(q)
  const out: Record<string, string> = {}
  params.forEach((value, key) => {
    out[key] = value
  })
  return out
}

function pathOf(url: string): string {
  return url.split('?')[0]
}

// ===========================================================================
// proxyImageUrl
// ===========================================================================
describe('proxyImageUrl', () => {
  it('builds /api/images/proxy URL with the image url param', () => {
    const url = proxyImageUrl('https://utfs.io/f/abc123.jpg')
    expect(pathOf(url)).toBe('/api/images/proxy')
    expect(parseQuery(url).url).toBe('https://utfs.io/f/abc123.jpg')
  })

  it('includes scope when provided', () => {
    const url = proxyImageUrl('https://utfs.io/f/abc123.jpg', 'students')
    const q = parseQuery(url)
    expect(q.scope).toBe('students')
    expect(q.url).toBe('https://utfs.io/f/abc123.jpg')
  })

  it('omits scope when not provided', () => {
    const url = proxyImageUrl('https://utfs.io/f/abc123.jpg')
    expect(parseQuery(url).scope).toBeUndefined()
  })

  it('includes width (w) and quality (q) options', () => {
    const url = proxyImageUrl('https://utfs.io/f/abc123.jpg', 'staff', { width: 400, quality: 80 })
    const q = parseQuery(url)
    expect(q.w).toBe('400')
    expect(q.q).toBe('80')
    expect(q.scope).toBe('staff')
  })

  it('omits width/quality when not provided', () => {
    const url = proxyImageUrl('https://utfs.io/f/abc123.jpg', 'resources')
    const q = parseQuery(url)
    expect(q.w).toBeUndefined()
    expect(q.q).toBeUndefined()
  })

  it('URL-encodes special characters in the image url', () => {
    const tricky = 'https://utfs.io/f/abc 123 (copy) & more.jpg'
    const url = proxyImageUrl(tricky)
    expect(decodeURIComponent(parseQuery(url).url)).toBe(tricky)
    expect(url).toContain('api/images/proxy')
  })

  it('handles a url already containing query parameters', () => {
    const tricky = 'https://cdn.example.com/img.jpg?token=abc&size=large'
    const url = proxyImageUrl(tricky)
    const q = parseQuery(url)
    // The whole original url must survive (its own query string is part of the value).
    expect(q.url).toContain('token=abc')
    expect(q.url).toContain('size=large')
  })

  it('handles empty string url without throwing', () => {
    const url = proxyImageUrl('')
    expect(parseQuery(url).url).toBe('')
  })
})

// ===========================================================================
// transformImageUrl
// ===========================================================================
describe('transformImageUrl', () => {
  it('builds /api/images/transform URL with the image url param', () => {
    const url = transformImageUrl('https://utfs.io/f/abc123.jpg')
    expect(pathOf(url)).toBe('/api/images/transform')
    expect(parseQuery(url).url).toBe('https://utfs.io/f/abc123.jpg')
  })

  it('includes width (w) when provided', () => {
    const url = transformImageUrl('https://utfs.io/f/abc123.jpg', { width: 800 })
    expect(parseQuery(url).w).toBe('800')
  })

  it('includes watermark=true when watermark is set', () => {
    const url = transformImageUrl('https://utfs.io/f/abc123.jpg', { watermark: true })
    expect(parseQuery(url).watermark).toBe('true')
  })

  it('omits watermark key when watermark is falsy', () => {
    const url = transformImageUrl('https://utfs.io/f/abc123.jpg', { watermark: false })
    expect(parseQuery(url).watermark).toBeUndefined()
  })

  it('includes strip=false only when strip is explicitly false', () => {
    const url = transformImageUrl('https://utfs.io/f/abc123.jpg', { strip: false })
    expect(parseQuery(url).strip).toBe('false')
  })

  it('omits strip key when strip is true or undefined', () => {
    const urlTrue = transformImageUrl('https://utfs.io/f/abc123.jpg', { strip: true })
    const urlUndef = transformImageUrl('https://utfs.io/f/abc123.jpg')
    expect(parseQuery(urlTrue).strip).toBeUndefined()
    expect(parseQuery(urlUndef).strip).toBeUndefined()
  })

  it('includes quality (q) when provided', () => {
    const url = transformImageUrl('https://utfs.io/f/abc123.jpg', { quality: 90 })
    expect(parseQuery(url).q).toBe('90')
  })

  it('includes format when provided', () => {
    const url = transformImageUrl('https://utfs.io/f/abc123.jpg', { format: 'webp' })
    expect(parseQuery(url).format).toBe('webp')
  })

  it('supports all format values', () => {
    for (const format of ['webp', 'jpeg', 'png', 'avif'] as const) {
      const url = transformImageUrl('https://utfs.io/f/x.jpg', { format })
      expect(parseQuery(url).format).toBe(format)
    }
  })

  it('combines all options into one URL', () => {
    const url = transformImageUrl('https://utfs.io/f/abc123.jpg', {
      width: 600,
      watermark: true,
      strip: false,
      quality: 75,
      format: 'avif',
    })
    expect(parseQuery(url)).toEqual({
      url: 'https://utfs.io/f/abc123.jpg',
      w: '600',
      watermark: 'true',
      strip: 'false',
      q: '75',
      format: 'avif',
    })
  })

  it('URL-encodes special characters in the image url', () => {
    const tricky = 'https://cdn.example.com/a b/c&d.png'
    const url = transformImageUrl(tricky)
    expect(decodeURIComponent(parseQuery(url).url)).toBe(tricky)
  })

  it('handles empty string url without throwing', () => {
    const url = transformImageUrl('')
    expect(parseQuery(url).url).toBe('')
  })
})
