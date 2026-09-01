import { describe, it, expect } from 'vitest'
import { generateInvoiceNumber, generateInvoicePDF } from '@/lib/invoice/generator'

describe('lib/invoice/generator', () => {
  describe('generateInvoiceNumber', () => {
    it('is a function', () => {
      expect(typeof generateInvoiceNumber).toBe('function')
    })
  })

  describe('generateInvoicePDF', () => {
    it('is a function', () => {
      expect(typeof generateInvoicePDF).toBe('function')
    })
  })
})
