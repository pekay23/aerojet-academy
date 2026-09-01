import { describe, it, expect } from 'vitest'
import { getModuleProgress, isModuleCompleted, getNextModule as getStudentNextModule, STUDENT_PROGRESS_STATUS } from '@/lib/student/progress'

describe('lib/student/progress', () => {
  describe('STUDENT_PROGRESS_STATUS', () => {
    it('has expected status values', () => {
      expect(STUDENT_PROGRESS_STATUS.NOT_STARTED).toBe('NOT_STARTED')
      expect(STUDENT_PROGRESS_STATUS.IN_PROGRESS).toBe('IN_PROGRESS')
      expect(STUDENT_PROGRESS_STATUS.COMPLETED).toBe('COMPLETED')
    })
  })

  describe('getModuleProgress', () => {
    it('returns NOT_STARTED when no progress', () => {
      expect(getModuleProgress([])).toBe('NOT_STARTED')
    })

    it('returns COMPLETED when all lessons done', () => {
      const lessons = [{ id: '1', completed: true }, { id: '2', completed: true }]
      expect(getModuleProgress(lessons)).toBe('COMPLETED')
    })

    it('returns IN_PROGRESS when some lessons done', () => {
      const lessons = [{ id: '1', completed: true }, { id: '2', completed: false }]
      expect(getModuleProgress(lessons)).toBe('IN_PROGRESS')
    })
  })

  describe('isModuleCompleted', () => {
    it('returns true when all lessons completed', () => {
      expect(isModuleCompleted([{ id: '1', completed: true }])).toBe(true)
    })

    it('returns false when any lesson incomplete', () => {
      expect(isModuleCompleted([{ id: '1', completed: true }, { id: '2', completed: false }])).toBe(false)
    })
  })

  describe('getNextModule', () => {
    it('returns first uncompleted module', () => {
      const modules = [
        { id: '1', completed: true },
        { id: '2', completed: false },
      ]
      const result = getStudentNextModule(modules)
      expect(result?.id).toBe('2')
    })

    it('returns null when all completed', () => {
      const modules = [
        { id: '1', completed: true },
        { id: '2', completed: true },
      ]
      expect(getStudentNextModule(modules)).toBeNull()
    })
  })
})
