import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '@/lib/utils/sanitize'

describe('lib/utils/sanitize', () => {
  it('allows safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    const result = sanitizeHtml(input)
    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
    expect(result).toContain('Hello')
    expect(result).toContain('world')
  })

  it('strips script tags', () => {
    const input = '<script>alert("xss")</script><p>Safe</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })

  it('strips event handlers', () => {
    const input = '<div onclick="alert(1)">click</div>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onclick')
  })

  it('allows safe attributes', () => {
    const input = '<a href="https://example.com">link</a>'
    const result = sanitizeHtml(input)
    expect(result).toContain('href="https://example.com"')
  })

  it('strips javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">link</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('javascript:')
  })
})
