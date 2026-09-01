import { describe, it, expect } from 'vitest'
import { sanitizeHtml, stripScripts, escapeHtml, removeXss } from '@/lib/security/xss'

describe('lib/security/xss', () => {
  describe('sanitizeHtml', () => {
    it('removes script tags', () => {
      const input = '<script>alert("xss")</script><p>Safe</p>'
      expect(sanitizeHtml(input)).not.toContain('<script>')
    })

    it('removes event handlers', () => {
      const input = '<div onclick="alert(1)">Click</div>'
      expect(sanitizeHtml(input)).not.toContain('onclick')
    })

    it('preserves safe HTML', () => {
      const input = '<p>Safe paragraph</p><strong>Bold</strong>'
      const result = sanitizeHtml(input)
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
    })
  })

  describe('stripScripts', () => {
    it('removes script tags', () => {
      expect(stripScripts('<script>alert(1)</script>')).not.toContain('alert')
    })

    it('removes script content', () => {
      expect(stripScripts('<script>malicious code</script>')).not.toContain('malicious')
    })

    it('preserves non-script content', () => {
      expect(stripScripts('<div>Normal content</div>')).toContain('Normal content')
    })
  })

  describe('escapeHtml', () => {
    it('escapes angle brackets', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
    })

    it('escapes ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b')
    })

    it('escapes quotes', () => {
      expect(escapeHtml('"test"')).toBe('&quot;test&quot;')
    })
  })

  describe('removeXss', () => {
    it('removes script tags', () => {
      expect(removeXss('<script>alert(1)</script>')).not.toContain('<script>')
    })

    it('removes javascript: URLs', () => {
      expect(removeXss('<a href="javascript:alert(1)">link</a>')).not.toContain('javascript:')
    })

    it('removes data: URLs', () => {
      expect(removeXss('<a href="data:text/html,<script>alert(1)</script>">link</a>')).not.toContain('data:')
    })

    it('preserves safe content', () => {
      expect(removeXss('<p>Safe content</p>')).toContain('Safe content')
    })
  })
})
