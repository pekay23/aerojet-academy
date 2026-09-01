import { describe, it, expect } from 'vitest'
import { validateExamQuestion, getQuestionType, calculateQuestionScore, EXAM_QUESTION_TYPES, QUESTION_POINTS } from '@/lib/exams/questions'

describe('lib/exams/questions', () => {
  describe('EXAM_QUESTION_TYPES', () => {
    it('has expected types', () => {
      expect(EXAM_QUESTION_TYPES.MULTIPLE_CHOICE).toBeDefined()
      expect(EXAM_QUESTION_TYPES.ESSAY).toBeDefined()
      expect(EXAM_QUESTION_TYPES.TRUE_FALSE).toBeDefined()
    })
  })

  describe('QUESTION_POINTS', () => {
    it('has points for each type', () => {
      expect(QUESTION_POINTS.MULTIPLE_CHOICE).toBeGreaterThan(0)
      expect(QUESTION_POINTS.ESSAY).toBeGreaterThan(0)
      expect(QUESTION_POINTS.TRUE_FALSE).toBeGreaterThan(0)
    })
  })

  describe('validateExamQuestion', () => {
    it('returns valid for complete question', () => {
      const result = validateExamQuestion({ type: 'MULTIPLE_CHOICE', text: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: '4' })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for missing text', () => {
      const result = validateExamQuestion({ type: 'MULTIPLE_CHOICE', options: ['3', '4', '5'], correctAnswer: '4' })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing options in MCQ', () => {
      const result = validateExamQuestion({ type: 'MULTIPLE_CHOICE', text: 'What is 2+2?', correctAnswer: '4' })
      expect(result.valid).toBe(false)
    })
  })

  describe('getQuestionType', () => {
    it('returns type by code', () => {
      expect(getQuestionType('MULTIPLE_CHOICE')).toBeDefined()
    })

    it('returns undefined for unknown code', () => {
      expect(getQuestionType('UNKNOWN')).toBeUndefined()
    })
  })

  describe('calculateQuestionScore', () => {
    it('returns full points for correct answer', () => {
      expect(calculateQuestionScore('MULTIPLE_CHOICE', true)).toBe(QUESTION_POINTS.MULTIPLE_CHOICE)
    })

    it('returns 0 for incorrect answer', () => {
      expect(calculateQuestionScore('MULTIPLE_CHOICE', false)).toBe(0)
    })
  })
})
