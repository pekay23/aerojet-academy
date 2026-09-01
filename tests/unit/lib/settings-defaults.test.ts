import { describe, it, expect } from 'vitest'
import { createDefaultSettings, getSetting, updateSetting, getAllSettings, SYSTEM_SETTINGS_KEYS } from '@/lib/settings/defaults'

describe('lib/settings/defaults', () => {
  describe('SYSTEM_SETTINGS_KEYS', () => {
    it('has expected keys', () => {
      expect(SYSTEM_SETTINGS_KEYS.APP_NAME).toBeDefined()
      expect(SYSTEM_SETTINGS_KEYS.MAX_UPLOAD_SIZE).toBeDefined()
      expect(SYSTEM_SETTINGS_KEYS.SESSION_TIMEOUT).toBeDefined()
    })

    it('each key has default value', () => {
      for (const [key, config] of Object.entries(SYSTEM_SETTINGS_KEYS)) {
        expect(config.defaultValue).toBeDefined()
      }
    })
  })

  describe('createDefaultSettings', () => {
    it('returns settings object', () => {
      const settings = createDefaultSettings()
      expect(typeof settings).toBe('object')
    })

    it('includes all default keys', () => {
      const settings = createDefaultSettings()
      for (const key of Object.keys(SYSTEM_SETTINGS_KEYS)) {
        expect(settings[key]).toBeDefined()
      }
    })
  })

  describe('getSetting', () => {
    it('returns value for existing key', () => {
      const value = getSetting('APP_NAME')
      expect(value).toBeDefined()
    })

    it('returns undefined for unknown key', () => {
      expect(getSetting('UNKNOWN_KEY')).toBeUndefined()
    })
  })

  describe('updateSetting', () => {
    it('updates setting value', () => {
      const updated = updateSetting('APP_NAME', 'New Name')
      expect(updated).toBe('New Name')
    })

    it('returns new value', () => {
      const result = updateSetting('MAX_UPLOAD_SIZE', 50)
      expect(result).toBe(50)
    })
  })

  describe('getAllSettings', () => {
    it('returns all settings', () => {
      const settings = getAllSettings()
      expect(typeof settings).toBe('object')
      expect(Object.keys(settings).length).toBeGreaterThan(0)
    })
  })
})
