import { describe, it, expect } from 'vitest'
import { parsePagination, parseSorting, parseSearch } from '@/lib/api/parsers'

describe('lib/api/parsers', () => {
  describe('parsePagination', () => {
    it('returns default values for empty input', () => {
      const result = parsePagination(new URLSearchParams())
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('parses page and limit from URL params', () => {
      const params = new URLSearchParams({ page: '3', limit: '50' })
      const result = parsePagination(params)
      expect(result.page).toBe(3)
      expect(result.limit).toBe(50)
    })

    it('clamps limit to max', () => {
      const params = new URLSearchParams({ limit: '9999' })
      const result = parsePagination(params)
      expect(result.limit).toBeLessThanOrEqual(100)
    })

    it('calculates skip from page and limit', () => {
      const params = new URLSearchParams({ page: '3', limit: '20' })
      const result = parsePagination(params)
      expect(result.skip).toBe(40)
    })
  })

  describe('parseSorting', () => {
    it('returns default sort for empty input', () => {
      const result = parseSorting(new URLSearchParams())
      expect(result.field).toBe('createdAt')
      expect(result.direction).toBe('desc')
    })

    it('parses field and direction', () => {
      const params = new URLSearchParams({ sort: 'name:asc' })
      const result = parseSorting(params)
      expect(result.field).toBe('name')
      expect(result.direction).toBe('asc')
    })

    it('returns desc for invalid direction', () => {
      const params = new URLSearchParams({ sort: 'name:invalid' })
      const result = parseSorting(params)
      expect(result.direction).toBe('desc')
    })
  })

  describe('parseSearch', () => {
    it('returns empty string for no search param', () => {
      const result = parseSearch(new URLSearchParams())
      expect(result).toBe('')
    })

    it('parses search query', () => {
      const params = new URLSearchParams({ q: 'test query' })
      const result = parseSearch(params)
      expect(result).toBe('test query')
    })

    it('trims whitespace', () => {
      const params = new URLSearchParams({ q: '  spaced  ' })
      const result = parseSearch(params)
      expect(result).toBe('spaced')
    })
  })
})
