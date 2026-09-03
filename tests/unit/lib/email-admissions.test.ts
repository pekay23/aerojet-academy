import { describe, it, expect } from 'vitest'
import { replacePlaceholders } from '@/lib/email/admissions'

describe('lib/email/admissions', () => {
  describe('replacePlaceholders', () => {
    it('replaces placeholders with values', () => {
      const template = 'Hi {{firstName}}, welcome to {{company}}'
      const result = replacePlaceholders(template, { firstName: 'John', company: 'Aerojet' })
      expect(result).toBe('Hi John, welcome to Aerojet')
    })

    it('leaves unmatched placeholders as-is', () => {
      const template = 'Hi {{firstName}}, your code is {{code}}'
      const result = replacePlaceholders(template, { firstName: 'John' })
      expect(result).toBe('Hi John, your code is {{code}}')
    })

    it('handles empty template', () => {
      const result = replacePlaceholders('', {})
      expect(result).toBe('')
    })

    it('handles multiple occurrences', () => {
      const template = '{{name}} said {{name}}'
      const result = replacePlaceholders(template, { name: 'Alice' })
      expect(result).toBe('Alice said Alice')
    })
  })
})
