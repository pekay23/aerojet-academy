import { describe, it, expect } from 'vitest'
import { getMediaType, validateMediaUpload, formatMediaSize, getMediaDuration, MEDIA_TYPES, MEDIA_SIZE_LIMITS } from '@/lib/uploads/media'

describe('lib/uploads/media', () => {
  describe('MEDIA_TYPES', () => {
    it('has expected types', () => {
      expect(MEDIA_TYPES.IMAGE).toBeDefined()
      expect(MEDIA_TYPES.VIDEO).toBeDefined()
      expect(MEDIA_TYPES.AUDIO).toBeDefined()
      expect(MEDIA_TYPES.DOCUMENT).toBeDefined()
    })

    it('each type has mime types', () => {
      for (const [key, type] of Object.entries(MEDIA_TYPES)) {
        expect(type.mimeTypes).toBeDefined()
        expect(Array.isArray(type.mimeTypes)).toBe(true)
      }
    })
  })

  describe('MEDIA_SIZE_LIMITS', () => {
    it('has size limit for each type', () => {
      for (const [type, limit] of Object.entries(MEDIA_SIZE_LIMITS)) {
        expect(limit).toBeGreaterThan(0)
      }
    })
  })

  describe('getMediaType', () => {
    it('returns type by mime', () => {
      expect(getMediaType('image/jpeg')).toBe('IMAGE')
    })

    it('returns type by extension', () => {
      expect(getMediaType('.jpg')).toBe('IMAGE')
    })

    it('returns UNKNOWN for unknown type', () => {
      expect(getMediaType('application/unknown')).toBe('UNKNOWN')
    })
  })

  describe('validateMediaUpload', () => {
    it('returns valid for valid image', () => {
      const result = validateMediaUpload({ type: 'IMAGE', size: 1024 * 1024, mimeType: 'image/jpeg' })
      expect(result.valid).toBe(true)
    })

    it('returns invalid for file too large', () => {
      const result = validateMediaUpload({ type: 'IMAGE', size: 100 * 1024 * 1024, mimeType: 'image/jpeg' })
      expect(result.valid).toBe(false)
    })

    it('returns invalid for wrong mime type', () => {
      const result = validateMediaUpload({ type: 'IMAGE', size: 1024, mimeType: 'application/pdf' })
      expect(result.valid).toBe(false)
    })
  })

  describe('formatMediaSize', () => {
    it('formats bytes to KB', () => {
      expect(formatMediaSize(1024)).toContain('KB')
    })

    it('formats bytes to MB', () => {
      expect(formatMediaSize(1048576)).toContain('MB')
    })
  })

  describe('getMediaDuration', () => {
    it('returns duration in seconds for video', () => {
      const duration = getMediaDuration({ type: 'VIDEO', duration: 120 })
      expect(duration).toBe(120)
    })

    it('returns 0 for unknown media type', () => {
      const duration = getMediaDuration({ type: 'UNKNOWN', duration: 120 })
      expect(duration).toBe(0)
    })
  })
})
