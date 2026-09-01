import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStorageAdapter, httpAdapter, type StorageAdapter } from '@/lib/storage/proxy'

describe('lib/storage/proxy', () => {
  describe('httpAdapter', () => {
    it('has name property', () => {
      expect(httpAdapter.name).toBe('http')
    })

    it('has fetch method', () => {
      expect(typeof httpAdapter.fetch).toBe('function')
    })
  })

  describe('getStorageAdapter', () => {
    it('returns HTTP adapter by default', () => {
      const originalEnv = process.env.STORAGE_ADAPTER
      delete process.env.STORAGE_ADAPTER

      const adapter = getStorageAdapter()
      expect(adapter.name).toBe('http')

      process.env.STORAGE_ADAPTER = originalEnv
    })

    it('returns HTTP adapter for http env', () => {
      const originalEnv = process.env.STORAGE_ADAPTER
      process.env.STORAGE_ADAPTER = 'http'

      const adapter = getStorageAdapter()
      expect(adapter.name).toBe('http')

      process.env.STORAGE_ADAPTER = originalEnv
    })

    it('returns HTTP adapter for unknown env', () => {
      const originalEnv = process.env.STORAGE_ADAPTER
      process.env.STORAGE_ADAPTER = 'unknown'

      const adapter = getStorageAdapter()
      expect(adapter.name).toBe('http')

      process.env.STORAGE_ADAPTER = originalEnv
    })
  })
})
