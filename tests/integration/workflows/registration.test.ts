import { describe, it, expect } from 'vitest'
import { mockApplicant } from '@/tests/fixtures/users'
import { isValidRegistrationCode } from '@/lib/utils/validation'

describe('Registration Workflow', () => {
  it('applicant starts with PAYMENT_PENDING status', () => {
    expect(mockApplicant.status).toBe('PAYMENT_PENDING')
    expect(mockApplicant.role).toBe('APPLICANT')
  })

  it('registration code follows format', () => {
    expect(isValidRegistrationCode(mockApplicant.registrationCode)).toBe(true)
  })
})
