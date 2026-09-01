import { describe, it, expect } from 'vitest'
import { getAdmissionStatus, getAdmissionStep, isAdmissionComplete, ADMISSION_STEPS, ADMISSION_STATUS } from '@/lib/admissions/status'

describe('lib/admissions/status', () => {
  describe('ADMISSION_STEPS', () => {
    it('has expected steps', () => {
      expect(ADMISSION_STEPS.APPLICATION).toBeDefined()
      expect(ADMISSION_STEPS.REVIEW).toBeDefined()
      expect(ADMISSION_STEPS.INTERVIEW).toBeDefined()
      expect(ADMISSION_STEPS.OFFER).toBeDefined()
    })

    it('each step has order', () => {
      for (const [key, step] of Object.entries(ADMISSION_STEPS)) {
        expect(step.order).toBeDefined()
        expect(typeof step.order).toBe('number')
      }
    })
  })

  describe('ADMISSION_STATUS', () => {
    it('has expected status values', () => {
      expect(ADMISSION_STATUS.DRAFT).toBe('DRAFT')
      expect(ADMISSION_STATUS.SUBMITTED).toBe('SUBMITTED')
      expect(ADMISSION_STATUS.UNDER_REVIEW).toBe('UNDER_REVIEW')
      expect(ADMISSION_STATUS.ACCEPTED).toBe('ACCEPTED')
      expect(ADMISSION_STATUS.REJECTED).toBe('REJECTED')
    })
  })

  describe('getAdmissionStatus', () => {
    it('returns correct status', () => {
      expect(getAdmissionStatus({ step: 'OFFER', completed: true })).toBe('ACCEPTED')
    })

    it('returns UNDER_REVIEW for review step', () => {
      expect(getAdmissionStatus({ step: 'REVIEW', completed: false })).toBe('UNDER_REVIEW')
    })
  })

  describe('getAdmissionStep', () => {
    it('returns next step', () => {
      expect(getAdmissionStep('APPLICATION')).toBe('REVIEW')
    })

    it('returns current step for unknown', () => {
      expect(getAdmissionStep('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('isAdmissionComplete', () => {
    it('returns true when all steps completed', () => {
      const steps = ['APPLICATION', 'REVIEW', 'INTERVIEW', 'OFFER']
      expect(isAdmissionComplete(steps)).toBe(true)
    })

    it('returns false when steps missing', () => {
      expect(isAdmissionComplete(['APPLICATION'])).toBe(false)
    })
  })
})
