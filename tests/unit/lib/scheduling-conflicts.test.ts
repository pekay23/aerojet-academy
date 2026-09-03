import { describe, it, expect } from 'vitest'
import { findConflicts } from '@/lib/scheduling/conflicts'

describe('lib/scheduling/conflicts', () => {
  describe('findConflicts', () => {
    it('is a function', () => {
      expect(typeof findConflicts).toBe('function')
    })
  })
})
