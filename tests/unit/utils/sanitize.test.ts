import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '@/lib/utils/sanitize'

describe('Sanitize', () => {
  describe('sanitizeHtml', () => {
    it('strips script tags', () => {
      const result = sanitizeHtml('<script>alert("xss")</script><p>safe</p>')
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>safe</p>')
    })

    it('strips event handlers', () => {
      const input = '<p onclick="alert(1)">text</p>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('onclick')
    })

    it('strips iframe with javascript src', () => {
      const input = '<iframe src="javascript:alert(1)"></iframe>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('javascript:')
    })

    it('allows safe formatting tags', () => {
      const input = '<h1>Title</h1><p><strong>Bold</strong> and <em>italic</em></p>'
      const result = sanitizeHtml(input)
      expect(result).toContain('<h1>')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
    })

    it('allows safe links', () => {
      const input = '<a href="https://example.com">link</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('<a href="https://example.com">')
    })

    it('strips javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">click</a>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('javascript:')
    })

    it('allows safe image attributes', () => {
      const input = '<img src="https://example.com/img.png" alt="desc" width="100" height="50">'
      const result = sanitizeHtml(input)
      expect(result).toContain('<img')
      expect(result).toContain('src="https://example.com/img.png"')
      expect(result).toContain('alt="desc"')
    })

    it('allows table markup', () => {
      const input = '<table><tr><th>H</th><td>D</td></tr></table>'
      const result = sanitizeHtml(input)
      expect(result).toContain('<table>')
      expect(result).toContain('<tr>')
      expect(result).toContain('<th>')
      expect(result).toContain('<td>')
    })

    it('handles empty string', () => {
      expect(sanitizeHtml('')).toBe('')
    })

    it('handles plain text', () => {
      const result = sanitizeHtml('Hello world')
      expect(result).toBe('Hello world')
    })

    it('strips nested script content', () => {
      const input = '<div><script>alert(1)</script></div>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<script>')
      expect(result).toContain('<div>')
    })

    it('allows class attribute but strips id and style', () => {
      const input = '<div class="foo" id="bar" style="color:red">text</div>'
      const result = sanitizeHtml(input)
      expect(result).toContain('class="foo"')
      expect(result).not.toContain('id="bar"')
      expect(result).not.toContain('style=')
    })
  })
})
