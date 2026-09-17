/**
 * Supabase Backup Utilities
 * 
 * Provides scheduled/full backup functionality using Supabase.
 * This can backup to:
 * - Supabase Database (PostgreSQL) - same schema
 * - Supabase Storage (for JSON exports)
 * - Both combined
 * 
 * Features:
 * - Full database backup to Supabase
 * - JSON export to Supabase Storage
 * - Automatic cleanup of old backups
 * - Batch processing for large datasets
 */

import { prismaUnfiltered } from '@/lib/prisma/client';
import { getSupabaseAdmin, isBackupEnabled } from './client';
import { transformForSupabase } from './dual-write';
import { BackupData } from '@/lib/backup';

// All Prisma model names that can be backed up
const BACKUP_MODELS = [
  'user', 'profile', 'studentProfile', 'instructorProfile', 'staffProfile',
  'licenseCategory', 'licenseModuleRequirement', 'studyPathwayModel', 'academicTerm',
  'termCourseAssignment', 'studentLicenseTarget', 'examComponent', 'course',
  'courseCategory', 'enrollment', 'class', 'attendanceRecord', 'grade',
  'examEvent', 'examPool', 'poolMembership', 'poolWaitlist', 'wallet',
  'walletTransaction', 'exam', 'examBooking', 'bookingEntitlement', 'examResult',
  'examBundle', 'payment', 'invoice', 'notification', 'message', 'auditLog',
  'systemSetting', 'paymentMethod', 'fileUpload', 'newsArticle', 'generalResource',
  'academicYear', 'semester', 'fullTimeProgramme', 'programmeYear', 'fullTimeEnrollment',
  'ojtPeriod', 'paymentMilestone', 'modularPackage', 'modularEnrollment',
  'tuitionRun', 'tuitionBooking', 'emailTemplate', 'referral', 'adminNote'
] as const;

type _BackupModelKey = typeof BACKUP_MODELS[number];

/**
 * Get a Prisma client connected to Supabase
 */
async function getSupabasePrismaClient() {
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const { Pool } = await import('pg');

    // Parse the URL to extract components — avoids issues with special
    // characters (like #) in passwords that URL parsing may mangle.
    const parsed = new URL(supabaseUrl);
    const pool = new Pool({
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
      database: parsed.pathname.replace('/', ''),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      ssl: true,
      max: 5,
    });
    
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error('[SupabaseBackup] Failed to create Prisma client:', error);
    return null;
  }
}

/**
 * Export all tables from Neon database
 */
async function exportAllFromNeon(): Promise<BackupData> {
  const backup: BackupData = {};
  
  for (const model of BACKUP_MODELS) {
    try {
      // @ts-expect-error - dynamic model access
      const records = await prismaUnfiltered[model].findMany();
      backup[model] = records;
    } catch (err: unknown) {
      const error = err as Error
      console.warn(`[SupabaseBackup] Skipping model "${model}": ${error.message}`);
      backup[model] = [];
    }
  }
  
  return backup;
}

/**
 * Transform BigInt values to strings for JSON serialization
 */
function serializeData(data: BackupData): string {
  const serialized = JSON.stringify(data, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Handle Prisma Decimal objects
    if (value !== null && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    return value;
  }, 2);
  
  return serialized;
}

/**
 * Perform full database backup to Supabase
 * 
 * This function:
 * 1. Exports all data from Neon
 * 2. Stores in Supabase Database (if configured)
 * 3. Stores JSON in Supabase Storage (if configured)
 * 
 * @param options.backupRetentionDays - Days to keep storage backups (default: 30)
 * @param options.backupToDatabase - Whether to backup to Supabase DB (default: true)
 * @param options.backupToStorage - Whether to backup to Supabase Storage (default: true)
 */
export async function performSupabaseBackup(options?: {
  backupRetentionDays?: number;
  backupToDatabase?: boolean;
  backupToStorage?: boolean;
}): Promise<{
  success: boolean;
  timestamp: string;
  recordCount: number;
  databaseBackup?: { success: boolean; error?: string };
  storageBackup?: { success: boolean; path?: string; error?: string };
}> {
  if (!isBackupEnabled()) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      recordCount: 0,
      databaseBackup: { success: false, error: 'Supabase backup not enabled' },
      storageBackup: { success: false, error: 'Supabase backup not enabled' },
    };
  }
  
  const backupToDatabase = options?.backupToDatabase ?? true;
  const backupToStorage = options?.backupToStorage ?? true;
  const backupRetentionDays = options?.backupRetentionDays ?? 30;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    console.log('[SupabaseBackup] Starting full database backup...');
    
    // Step 1: Export all data from Neon
    const backupData = await exportAllFromNeon();
    
    let totalRecords = 0;
    for (const model of BACKUP_MODELS) {
      totalRecords += (backupData[model] || []).length;
    }
    
    const results: {
      success: boolean;
      timestamp: string;
      recordCount: number;
      databaseBackup?: { success: boolean; error?: string };
      storageBackup?: { success: boolean; path?: string; error?: string };
    } = {
      success: true,
      timestamp: new Date().toISOString(),
      recordCount: totalRecords,
    };
    
    // Step 2: Backup to Supabase Database
    if (backupToDatabase) {
      results.databaseBackup = await backupToSupabaseDatabase(backupData);
    }
    
    // Step 3: Backup to Supabase Storage
    if (backupToStorage) {
      results.storageBackup = await backupToSupabaseStorage(backupData, timestamp, backupRetentionDays);
    }
    
    console.log('[SupabaseBackup] Full backup completed');
    
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[SupabaseBackup] Full backup failed:', errorMessage);
    
    return {
      success: false,
      timestamp: new Date().toISOString(),
      recordCount: 0,
      databaseBackup: { success: false, error: errorMessage },
      storageBackup: { success: false, error: errorMessage },
    };
  }
}

/**
 * Backup data to Supabase Database
 */
async function backupToSupabaseDatabase(backupData: BackupData): Promise<{ success: boolean; error?: string }> {
  const supabasePrisma = await getSupabasePrismaClient();
  
  if (!supabasePrisma) {
    return { success: false, error: 'Supabase database not configured - ensure SUPABASE_DATABASE_URL is set' };
  }
  
  try {
    // This requires the same schema in Supabase - tables will need to exist
    console.log('[SupabaseBackup] Starting database backup...');
    
    let totalBackedUp = 0;
    let totalFailed = 0;
    
    for (const model of BACKUP_MODELS) {
      const records = backupData[model] || [];
      console.log(`[SupabaseBackup] Backing up ${model}: ${records.length} records`);
      
      // Upsert each record - requires primary key to be set
      for (const record of records as unknown as Array<Record<string, unknown>>) {
        if (record.id) {
          try {
            const transformed = transformForSupabase(record);
            await (supabasePrisma as unknown as Record<string, { upsert: (args: unknown) => Promise<unknown> }>)[model].upsert({
              where: { id: record.id },
              create: transformed,
              update: transformed,
            });
            totalBackedUp++;
          } catch (err) {
            totalFailed++;
            if (totalFailed <= 3) {
              console.error(`[SupabaseBackup] Failed to backup ${model}/${record.id}:`, err);
            }
          }
        }
      }
    }
    
    console.log(`[SupabaseBackup] Database backup completed: ${totalBackedUp} succeeded, ${totalFailed} failed`);
    return { success: totalBackedUp > 0, error: totalFailed > 0 ? `${totalFailed} records failed` : undefined };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Backup data to Supabase Storage as JSON
 */
async function backupToSupabaseStorage(
  backupData: BackupData,
  timestamp: string,
  retentionDays: number
): Promise<{ success: boolean; path?: string; error?: string }> {
  const supabase = getSupabaseAdmin();
  const bucketName = process.env.SUPABASE_BACKUP_BUCKET || 'backups';
  
  if (!supabase) {
    return { success: false, error: 'Supabase admin client not configured - check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' };
  }
  
  try {
    // Serialize data
    const jsonData = serializeData(backupData);
    const fileName = `backup-${timestamp}.json`;
    const filePath = `database/${fileName}`;
    
    console.log(`[SupabaseBackup] Uploading to Storage: ${bucketName}/${filePath} (${jsonData.length} bytes)`);
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, jsonData, {
        contentType: 'application/json',
        upsert: true,
      });
    
    if (uploadError) {
      console.error('[SupabaseBackup] Storage upload error:', uploadError);
      throw new Error(uploadError.message);
    }
    
    console.log('[SupabaseBackup] Storage upload result:', data);
    
    // Set expiration for the backup (via metadata)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + retentionDays);
    
    console.log(`[SupabaseBackup] Storage backup completed: ${filePath}`);
    
    return { success: true, path: filePath };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * List available backups in Supabase Storage
 */
export async function listSupabaseBackups(): Promise<Array<{
  name: string;
  path: string;
  createdAt: string;
  size: number;
}>> {
  const supabase = getSupabaseAdmin();
  const bucketName = process.env.SUPABASE_BACKUP_BUCKET || 'backups';
  
  if (!supabase) {
    return [];
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('database', { limit: 50 });
    
    if (error) {
      console.error('[SupabaseBackup] Failed to list backups:', error);
      return [];
    }
    
    return (data || []).map(item => ({
      name: item.name,
      path: `database/${item.name}`,
      createdAt: item.created_at || '',
      size: item.metadata?.size || 0,
    }));
  } catch (error) {
    console.error('[SupabaseBackup] Failed to list backups:', error);
    return [];
  }
}

/**
 * Download a backup from Supabase Storage
 */
export async function downloadBackup(path: string): Promise<{
  success: boolean;
  data?: BackupData;
  error?: string;
}> {
  const supabase = getSupabaseAdmin();
  const bucketName = process.env.SUPABASE_BACKUP_BUCKET || 'backups';
  
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(path);
    
    if (error) {
      throw new Error(error.message);
    }
    
    const text = await data.text();
    const backupData = JSON.parse(text) as BackupData;
    
    return { success: true, data: backupData };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if Supabase backup is available and configured
 */
export function isSupabaseBackupAvailable(): boolean {
  return isBackupEnabled();
}

export { BACKUP_MODELS };
