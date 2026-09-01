import { describe, it, expect } from 'vitest'
import { getTemplateById, renderTemplate, getTemplateVariables, EMAIL_TEMPLATES, TEMPLATE_VARIABLES } from '@/lib/email/template-engine'

describe('lib/email/template-engine', () => {
  describe('EMAIL_TEMPLATES', () => {
    it('has expected templates', () => {
      expect(EMAIL_TEMPLATES.WELCOME).toBeDefined()
      expect(EMAIL_TEMPLATES.PASSWORD_RESET).toBeDefined()
      expect(EMAIL_TEMPLATES.ENROLLMENT_CONFIRMATION).toBeDefined()
    })

    it('each template has subject and body', () => {
      for (const [key, template] of Object.entries(EMAIL_TEMPLATES)) {
        expect(template.subject).toBeDefined()
        expect(template.body).toBeDefined()
      }
    })
  })

  describe('TEMPLATE_VARIABLES', () => {
    it('has expected variables', () => {
      expect(TEMPLATE_VARIABLES.USER_NAME).toBeDefined()
      expect(TEMPLATE_VARIABLES.COURSE_NAME).toBeDefined()
      expect(TEMPLATE_VARIABLES.DATE).toBeDefined()
    })
  })

  describe('getTemplateById', () => {
    it('returns template by id', () => {
      expect(getTemplateById('WELCOME')).toBeDefined()
    })

    it('returns undefined for unknown id', () => {
      expect(getTemplateById('UNKNOWN')).toBeUndefined()
    })
  })

  describe('renderTemplate', () => {
    it('returns rendered string', () => {
      const template = EMAIL_TEMPLATES.WELCOME
      const rendered = renderTemplate(template, { userName: 'John', courseName: 'PPL' })
      expect(typeof rendered).toBe('string')
    })

    it('replaces variables', () => {
      const template = EMAIL_TEMPLATES.WELCOME
      const rendered = renderTemplate(template, { userName: 'John', courseName: 'PPL' })
      expect(rendered).toContain('John')
      expect(rendered).toContain('PPL')
    })
  })

  describe('getTemplateVariables', () => {
    it('returns variables for template', () => {
      const variables = getTemplateVariables('WELCOME')
      expect(Array.isArray(variables)).toBe(true)
    })

    it('returns empty array for unknown template', () => {
      expect(getTemplateVariables('UNKNOWN')).toEqual([])
    })
  })
})
