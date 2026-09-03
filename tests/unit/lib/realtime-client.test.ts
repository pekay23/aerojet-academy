import { describe, it, expect } from 'vitest'
import { getRealtimeClient } from '@/lib/realtime/client'

describe('lib/realtime/client', () => {
  describe('getRealtimeClient', () => {
    it('is a function', () => {
      expect(typeof getRealtimeClient).toBe('function')
    })

    it('returns null when Supabase not configured', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
      expect(getRealtimeClient()).toBeNull()
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })
  })
})
