import { describe, it, expect } from 'vitest'
import { sendEmail, sendBulkEmails } from '@/lib/email/index'

describe('lib/email/index', () => {
  it('re-exports sendEmail', () => {
    expect(typeof sendEmail).toBe('function')
  })

  it('re-exports sendBulkEmails', () => {
    expect(typeof sendBulkEmails).toBe('function')
  })
})
