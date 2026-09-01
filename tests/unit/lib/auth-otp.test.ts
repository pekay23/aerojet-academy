import { describe, it, expect } from 'vitest'
import { validateOtp, generateOtp, isOtpExpired, OTP_EXPIRY_SECONDS, OTP_LENGTH } from '@/lib/auth/otp'

describe('lib/auth/otp', () => {
  describe('OTP_LENGTH', () => {
    it('is a positive number', () => {
      expect(OTP_LENGTH).toBeGreaterThan(0)
    })

    it('is typically 6', () => {
      expect(OTP_LENGTH).toBe(6)
    })
  })

  describe('OTP_EXPIRY_SECONDS', () => {
    it('is a positive number', () => {
      expect(OTP_EXPIRY_SECONDS).toBeGreaterThan(0)
    })
  })

  describe('generateOtp', () => {
    it('returns string of correct length', () => {
      const otp = generateOtp()
      expect(typeof otp).toBe('string')
      expect(otp.length).toBe(OTP_LENGTH)
    })

    it('returns numeric string', () => {
      const otp = generateOtp()
      expect(/^\d+$/.test(otp)).toBe(true)
    })

    it('generates unique otps', () => {
      const otp1 = generateOtp()
      const otp2 = generateOtp()
      expect(otp1).not.toBe(otp2)
    })
  })

  describe('validateOtp', () => {
    it('returns true for correct otp within expiry', () => {
      const otp = generateOtp()
      expect(validateOtp(otp, otp, Date.now())).toBe(true)
    })

    it('returns false for incorrect otp', () => {
      expect(validateOtp('123456', '654321', Date.now())).toBe(false)
    })

    it('returns false for expired otp', () => {
      const otp = generateOtp()
      const expiredTime = Date.now() - (OTP_EXPIRY_SECONDS * 1000 + 1000)
      expect(validateOtp(otp, otp, expiredTime)).toBe(false)
    })
  })

  describe('isOtpExpired', () => {
    it('returns true for expired otp', () => {
      const otpTime = Date.now() - (OTP_EXPIRY_SECONDS * 1000 + 1000)
      expect(isOtpExpired(otpTime)).toBe(true)
    })

    it('returns false for valid otp', () => {
      expect(isOtpExpired(Date.now())).toBe(false)
    })
  })
})
