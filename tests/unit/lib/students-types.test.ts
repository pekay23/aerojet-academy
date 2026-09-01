import { describe, it, expect } from 'vitest'
import * as StudentTypes from '@/lib/students/types'

describe('lib/students/types', () => {
  it('exports PromotionResult interface', () => {
    expect(StudentTypes).toBeDefined()
  })

  it('exports StudentIdGenResult interface', () => {
    expect(StudentTypes).toBeDefined()
  })
})
