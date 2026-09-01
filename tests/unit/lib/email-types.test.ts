import { describe, it, expect } from 'vitest'
import { EmailTemplate } from '@/lib/email/types'

describe('lib/email/types', () => {
  it('exports EmailTemplate type', () => {
    const template: EmailTemplate = 'welcome'
    expect(template).toBe('welcome')
  })

  it('has all expected template values', () => {
    const templates: EmailTemplate[] = [
      'welcome',
      'activation',
      'password-reset',
      'payment-approved',
      'payment-rejected',
      'enrollment-approved',
      'promotion-to-student',
      'pool-joined',
      'pool-confirmed',
      'pool-failed',
      'exam-reminder',
      'contact-form',
    ]
    templates.forEach((t) => {
      expect(typeof t).toBe('string')
    })
  })
})
