import { describe, it, expect } from 'vitest'
import { createStudent, updateStudent, deleteStudent, getStudent, STUDENT_STATUS, STUDENT_TYPES } from '@/lib/students/manager'

describe('lib/students/manager', () => {
  describe('STUDENT_STATUS', () => {
    it('has expected status values', () => {
      expect(STUDENT_STATUS.ACTIVE).toBe('ACTIVE')
      expect(STUDENT_STATUS.INACTIVE).toBe('INACTIVE')
      expect(STUDENT_STATUS.GRADUATED).toBe('GRADUATED')
      expect(STUDENT_STATUS.SUSPENDED).toBe('SUSPENDED')
    })
  })

  describe('STUDENT_TYPES', () => {
    it('has expected type values', () => {
      expect(STUDENT_TYPES.FULL_TIME).toBe('FULL_TIME')
      expect(STUDENT_TYPES.MODULAR).toBe('MODULAR')
      expect(STUDENT_TYPES.EXAM_ONLY).toBe('EXAM_ONLY')
    })
  })

  describe('createStudent', () => {
    it('returns student object', () => {
      const student = createStudent({ name: 'John Doe', email: 'john@example.com' })
      expect(student).toBeDefined()
      expect(student.name).toBe('John Doe')
    })

    it('sets default status', () => {
      const student = createStudent({ name: 'John Doe', email: 'john@example.com' })
      expect(student.status).toBe('ACTIVE')
    })

    it('generates student id', () => {
      const student = createStudent({ name: 'John Doe', email: 'john@example.com' })
      expect(student.id).toBeDefined()
      expect(typeof student.id).toBe('string')
    })
  })

  describe('updateStudent', () => {
    it('updates student fields', () => {
      const student = createStudent({ name: 'John Doe', email: 'john@example.com' })
      const updated = updateStudent(student.id, { name: 'Jane Doe' })
      expect(updated.name).toBe('Jane Doe')
    })

    it('preserves id', () => {
      const student = createStudent({ name: 'John Doe', email: 'john@example.com' })
      const updated = updateStudent(student.id, { name: 'Jane Doe' })
      expect(updated.id).toBe(student.id)
    })
  })

  describe('deleteStudent', () => {
    it('returns true on successful delete', () => {
      const student = createStudent({ name: 'John Doe', email: 'john@example.com' })
      expect(deleteStudent(student.id)).toBe(true)
    })

    it('returns false for nonexistent student', () => {
      expect(deleteStudent('nonexistent')).toBe(false)
    })
  })

  describe('getStudent', () => {
    it('returns student by id', () => {
      const student = createStudent({ name: 'John Doe', email: 'john@example.com' })
      const found = getStudent(student.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(student.id)
    })

    it('returns undefined for unknown id', () => {
      expect(getStudent('unknown')).toBeUndefined()
    })
  })
})
