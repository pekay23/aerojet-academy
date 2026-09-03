import { describe, it, expect } from 'vitest'
import { naturalCollator, naturalSort, compareNatural } from '@/lib/utils/natural-sort'

describe('lib/utils/natural-sort', () => {
  describe('naturalCollator', () => {
    it('is an Intl.Collator instance', () => {
      expect(naturalCollator.compare('a', 'b')).toBeLessThan(0)
    })
  })

  describe('naturalSort', () => {
    it('sorts alphanumeric strings naturally', () => {
      const items = [
        { name: 'Module 10' },
        { name: 'Module 1' },
        { name: 'Module 2' },
      ]
      const result = naturalSort(items, (item) => item.name)
      expect(result.map((i) => i.name)).toEqual(['Module 1', 'Module 2', 'Module 10'])
    })

    it('does not mutate original array', () => {
      const items = [{ name: 'B' }, { name: 'A' }]
      naturalSort(items, (item) => item.name)
      expect(items[0].name).toBe('B')
    })
  })

  describe('compareNatural', () => {
    it('returns negative for a < b', () => {
      expect(compareNatural('A1', 'A10')).toBeLessThan(0)
    })

    it('returns positive for a > b', () => {
      expect(compareNatural('A10', 'A1')).toBeGreaterThan(0)
    })

    it('returns 0 for equal strings', () => {
      expect(compareNatural('A1', 'A1')).toBe(0)
    })
  })
})
