import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import {
  generateBekPair,
  verifySebRequestHash,
  generateSebConfig,
  type SebConfig,
} from '@/lib/internal-exam/seb-config'

describe('lib/internal-exam/seb-config', () => {
  describe('generateBekPair', () => {
    it('generates a valid BEK pair with correct lengths', () => {
      const pair = generateBekPair()
      expect(pair.publicKey).toHaveLength(64) // 32 bytes hex
      expect(pair.privateKey).toHaveLength(128) // 64 bytes hex
      expect(pair.configKey).toHaveLength(32) // 16 bytes hex
    })

    it('generates unique keys on each call', () => {
      const pair1 = generateBekPair()
      const pair2 = generateBekPair()
      expect(pair1.publicKey).not.toBe(pair2.publicKey)
      expect(pair1.privateKey).not.toBe(pair2.privateKey)
      expect(pair1.configKey).not.toBe(pair2.configKey)
    })

    it('generates valid hex strings', () => {
      const pair = generateBekPair()
      expect(pair.publicKey).toMatch(/^[0-9a-f]{64}$/)
      expect(pair.privateKey).toMatch(/^[0-9a-f]{128}$/)
      expect(pair.configKey).toMatch(/^[0-9a-f]{32}$/)
    })
  })

  describe('verifySebRequestHash', () => {
    it('returns true for valid hash', () => {
      const pair = generateBekPair()
      const startUrl = 'https://example.com/exam'
      const examTime = 3600

      const expectedHash = crypto
        .createHash('sha256')
        .update(pair.configKey + startUrl + examTime.toString())
        .digest('hex')

      const result = verifySebRequestHash(expectedHash, pair, startUrl, examTime)
      expect(result).toBe(true)
    })

    it('returns false for invalid hash', () => {
      const pair = generateBekPair()
      const result = verifySebRequestHash('invalid-hash', pair, 'https://example.com', 3600)
      expect(result).toBe(false)
    })

    it('returns false when configKey does not match', () => {
      const pair1 = generateBekPair()
      const pair2 = generateBekPair()
      const startUrl = 'https://example.com/exam'
      const examTime = 3600

      const hash = crypto
        .createHash('sha256')
        .update(pair1.configKey + startUrl + examTime.toString())
        .digest('hex')

      const result = verifySebRequestHash(hash, pair2, startUrl, examTime)
      expect(result).toBe(false)
    })

    it('returns false when startUrl does not match', () => {
      const pair = generateBekPair()
      const examTime = 3600

      const hash = crypto
        .createHash('sha256')
        .update(pair.configKey + 'https://example.com/exam' + examTime.toString())
        .digest('hex')

      const result = verifySebRequestHash(hash, pair, 'https://other.com/exam', examTime)
      expect(result).toBe(false)
    })

    it('returns false when examTime does not match', () => {
      const pair = generateBekPair()
      const startUrl = 'https://example.com/exam'

      const hash = crypto
        .createHash('sha256')
        .update(pair.configKey + startUrl + '3600')
        .digest('hex')

      const result = verifySebRequestHash(hash, pair, startUrl, 1800)
      expect(result).toBe(false)
    })
  })

  describe('generateSebConfig', () => {
    const baseConfig: SebConfig = {
      start_url: 'https://example.com/exam',
      config_key: 'abc123def456',
      allow_quit: false,
      show_taskbar: false,
      enable_exit_sequencer: false,
      allowed_applications: [],
      blocked_applications: [],
      enable_print_screen: false,
      enable_clipboard: false,
      enable_developer_tools: false,
      exam_time: 3600,
    }

    it('generates a valid ZIP buffer', () => {
      const zip = generateSebConfig(baseConfig)
      expect(zip).toBeInstanceOf(Uint8Array)
      expect(zip.length).toBeGreaterThan(0)
    })

    it('starts with PK zip signature', () => {
      const zip = generateSebConfig(baseConfig)
      expect(zip[0]).toBe(0x50) // 'P'
      expect(zip[1]).toBe(0x4b) // 'K'
    })

    it('contains config.json filename', () => {
      const zip = generateSebConfig(baseConfig)
      const decoder = new TextDecoder()
      const content = decoder.decode(zip)
      expect(content).toContain('config.json')
    })

    it('contains the config.json filename', () => {
      const zip = generateSebConfig(baseConfig)
      const decoder = new TextDecoder()
      const content = decoder.decode(zip)
      expect(content).toContain('config.json')
    })

    it('generates different output for different configs', () => {
      const zip1 = generateSebConfig(baseConfig)
      const zip2 = generateSebConfig({ ...baseConfig, start_url: 'https://other.com' })
      expect(zip1).not.toEqual(zip2)
    })

    it('produces a buffer with valid ZIP structure', () => {
      const zip = generateSebConfig(baseConfig)
      // Local file header signature: PK at the start
      expect(zip[0]).toBe(0x50)
      expect(zip[1]).toBe(0x4b)
      // End of central directory signature: PK at position length-22
      expect(zip[zip.length - 22]).toBe(0x50)
      expect(zip[zip.length - 21]).toBe(0x4b)
    })
  })
})
