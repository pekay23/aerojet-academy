import { describe, it, expect } from 'vitest'
import { getInitials, generateAvatarUrl, AVATAR_COLORS } from '@/lib/users/avatar'

describe('lib/users/avatar', () => {
  describe('getInitials', () => {
    it('returns first letter of first name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('returns first letters of first and last name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('handles single letter names', () => {
      expect(getInitials('A')).toBe('A')
    })

    it('returns empty string for null input', () => {
      expect(getInitials(null)).toBe('')
    })

    it('trims whitespace', () => {
      expect(getInitials('  John  Doe  ')).toBe('JD')
    })
  })

  describe('generateAvatarUrl', () => {
    it('returns string URL', () => {
      expect(typeof generateAvatarUrl('John Doe')).toBe('string')
    })

    it('includes name in URL', () => {
      const url = generateAvatarUrl('John Doe')
      expect(url).toContain('John')
      expect(url).toContain('Doe')
    })

    it('returns same URL for same name', () => {
      expect(generateAvatarUrl('John Doe')).toBe(generateAvatarUrl('John Doe'))
    })
  })

  describe('AVATAR_COLORS', () => {
    it('has multiple colors', () => {
      expect(AVATAR_COLORS.length).toBeGreaterThan(1)
    })

    it('each color has background and text properties', () => {
      for (const color of AVATAR_COLORS) {
        expect(color).toHaveProperty('background')
        expect(color).toHaveProperty('text')
      }
    })
  })
})
