import { describe, it, expect } from 'vitest'
import { getSettingValue, updateSettingValue, getAllSettings, SETTING_TYPES, SETTING_CATEGORIES } from '@/lib/settings/values'

describe('lib/settings/values', () => {
  describe('SETTING_TYPES', () => {
    it('has expected types', () => {
      expect(SETTING_TYPES.STRING).toBeDefined()
      expect(SETTING_TYPES.NUMBER).toBeDefined()
      expect(SETTING_TYPES.BOOLEAN).toBeDefined()
      expect(SETTING_TYPES.JSON).toBeDefined()
    })
  })

  describe('SETTING_CATEGORIES', () => {
    it('has expected categories', () => {
      expect(SETTING_CATEGORIES.GENERAL).toBeDefined()
      expect(SETTING_CATEGORIES.NOTIFICATIONS).toBeDefined()
      expect(SETTING_CATEGORIES.PAYMENTS).toBeDefined()
      expect(SETTING_CATEGORIES.SECURITY).toBeDefined()
    })
  })

  describe('getSettingValue', () => {
    it('returns value for existing setting', () => {
      expect(getSettingValue('APP_NAME')).toBeDefined()
    })

    it('returns undefined for unknown setting', () => {
      expect(getSettingValue('UNKNOWN_SETTING')).toBeUndefined()
    })
  })

  describe('updateSettingValue', () => {
    it('updates setting value', () => {
      const updated = updateSettingValue('APP_NAME', 'New Name')
      expect(updated).toBe('New Name')
    })

    it('returns new value', () => {
      const result = updateSettingValue('MAX_UPLOAD_SIZE', 50)
      expect(result).toBe(50)
    })
  })

  describe('getAllSettings', () => {
    it('returns all settings', () => {
      const settings = getAllSettings()
      expect(typeof settings).toBe('object')
      expect(Object.keys(settings).length).toBeGreaterThan(0)
    })

    it('includes all categories', () => {
      const settings = getAllSettings()
      for (const category of Object.values(SETTING_CATEGORIES)) {
        expect(settings[category]).toBeDefined()
      }
    })
  })
})
