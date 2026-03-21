/**
 * Supabase Module Index
 * 
 * Central export point for all Supabase utilities.
 * This module provides:
 * - Supabase client initialization
 * - Dual-write utilities for real-time backup
 * - Backup utilities for full database backups
 * 
 * Usage:
 * 
 * 1. Configure environment variables:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *    - SUPABASE_SERVICE_ROLE_KEY
 *    - SUPABASE_DATABASE_URL (for direct PostgreSQL connection)
 *    - SUPABASE_BACKUP_ENABLED=true
 * 
 * 2. Use dual-write for critical data:
 *    import { createWithBackup, updateWithBackup } from '@/lib/supabase';
 * 
 * 3. Use scheduled backups:
 *    import { performSupabaseBackup, listSupabaseBackups } from '@/lib/supabase';
 */

// Client exports
export {
  getSupabaseClient,
  getSupabaseAdmin,
  isSupabaseConfigured,
  isBackupEnabled,
  supabaseClient,
} from './client';

// Dual-write exports
export {
  createWithBackup,
  updateWithBackup,
  deleteWithBackup,
  readWithFallback,
  isBackupActive,
  BACKUP_MODELS,
} from './dual-write';

// Backup exports
export {
  performSupabaseBackup,
  listSupabaseBackups,
  downloadBackup,
  isSupabaseBackupAvailable,
  BACKUP_MODELS as BACKUP_MODELS_LIST,
} from './backup';
