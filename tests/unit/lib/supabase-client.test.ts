import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSupabaseAdmin, getSupabaseClient, isBackupEnabled } from '@/lib/supabase/client'

// Mock the module to control env vars
vi.mock('@/lib/supabase/client', async () => {
  const actual = await vi.importActual('@/lib/supabase/client')
  return {
    ...actual,
    isSupabaseConfigured: false, // default
  }
})

describe('lib/supabase/client', () => {
  describe('getSupabaseAdmin', () => {
    it('returns null when not configured', () => {
      expect(getSupabaseAdmin()).toBeNull()
    })
  })

  describe('getSupabaseClient', () => {
    it('returns null when not configured', () => {
      expect(getSupabaseClient()).toBeNull()
    })
  })

  describe('isBackupEnabled', () => {
    it('returns false when Supabase is not configured', () => {
      expect(isBackupEnabled()).toBe(false)
    })
  })
})
