import { describe, it, expect, vi } from 'vitest'
import { cn } from '@/lib/utils/index'

describe('lib/utils/index', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('handles undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('handles empty strings', () => {
      expect(cn('', 'foo', '')).toBe('foo')
    })

    it('merges tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })
})
