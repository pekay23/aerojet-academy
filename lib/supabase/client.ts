/**
 * Supabase Client for Backup/Replica
 *
 * This module provides Supabase integration for your Neon DB setup.
 * Supabase can be used as:
 * - A read replica for load distribution
 * - Real-time data synchronization
 * - Backup storage with PostgreSQL compatibility
 * - File storage for backups
 *
 * Primary DB: Neon (PostgreSQL) via Prisma
 * Backup/Replica: Supabase (PostgreSQL)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Type-safe Supabase client (using any for now, can be typed later)
type PublicSupabase = SupabaseClient

// Singleton client for client-side (browser)
let supabaseClient: PublicSupabase | null = null

/**
 * Get Supabase client for client-side (browser) usage
 * Uses anon key - suitable for public operations
 */
export function getSupabaseClient(): PublicSupabase | null {
  if (!isSupabaseConfigured) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[Supabase] Not configured - set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return supabaseClient
}

/**
 * Get Supabase admin client for server-side operations
 * Uses service role key - bypasses RLS (Row Level Security)
 */
let supabaseAdminClient: PublicSupabase | null = null

export function getSupabaseAdmin(): PublicSupabase | null {
  if (!isSupabaseConfigured || !supabaseServiceKey) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Supabase Admin] Service role key not configured')
    }
    return null
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return supabaseAdminClient
}

/**
 * Check if backup mode is enabled
 */
export function isBackupEnabled(): boolean {
  return process.env.SUPABASE_BACKUP_ENABLED === 'true' && isSupabaseConfigured
}

// Export typed client
export { supabaseClient }
export type { PublicSupabase }
