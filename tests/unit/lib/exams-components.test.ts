import { describe, it, expect } from 'vitest'
import { getNextExamComponent, isExamComponentComplete, calculateExamProgress, EXAM_COMPONENTS, EXAM_COMPONENT_ORDER } from '@/lib/exams/components'

describe('lib/exams/components', () => {
  describe('EXAM_COMPONENTS', () => {
    it('has expected components', () => {
      expect(EXAM_COMPONENTS.THEORY).toBeDefined()
      expect(EXAM_COMPONENTS.PRACTICAL).toBeDefined()
      expect(EXAM_COMPONENTS.ORAL).toBeDefined()
    })

    it('each component has name and order', () => {
      for (const [key, component] of Object.entries(EXAM_COMPONENTS)) {
        expect(component.name).toBeDefined()
        expect(component.order).toBeDefined()
      }
    })
  })

  describe('EXAM_COMPONENT_ORDER', () => {
    it('is an array', () => {
      expect(Array.isArray(EXAM_COMPONENT_ORDER)).toBe(true)
    })

    it('has components in order', () => {
      expect(EXAM_COMPONENT_ORDER.length).toBeGreaterThan(0)
    })
  })

  describe('getNextExamComponent', () => {
    it('returns first component when none completed', () => {
      const next = getNextExamComponent([])
      expect(next).toBeDefined()
    })

    it('returns next uncompleted component', () => {
      const completed = ['THEORY']
      const next = getNextExamComponent(completed)
      expect(next).not.toBe('THEORY')
    })

    it('returns null when all completed', () => {
      const all = Object.keys(EXAM_COMPONENTS)
      expect(getNextExamComponent(all)).toBeNull()
    })
  })

  describe('isExamComponentComplete', () => {
    it('returns true for completed component', () => {
      expect(isExamComponentComplete('THEORY', ['THEORY', 'PRACTICAL'])).toBe(true)
    })

    it('returns false for uncompleted component', () => {
      expect(isExamComponentComplete('ORAL', ['THEORY'])).toBe(false)
    })
  })

  describe('calculateExamProgress', () => {
    it('returns 0 for no completed components', () => {
      expect(calculateExamProgress([])).toBe(0)
    })

    it('returns 100 for all completed', () => {
      const all = Object.keys(EXAM_COMPONENTS)
      expect(calculateExamProgress(all)).toBe(100)
    })

    it('returns correct percentage', () => {
      const completed = ['THEORY', 'PRACTICAL']
      const total = Object.keys(EXAM_COMPONENTS).length
      expect(calculateExamProgress(completed)).toBe((completed.length / total) * 100)
    })
  })
})
