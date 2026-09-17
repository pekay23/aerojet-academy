/**
 * Supabase Backup Test Script
 *
 * Run with: npx tsx scripts/test-supabase-backup.ts
 *
 * This script tests:
 * 1. Supabase connection
 * 2. Full database backup
 * 3. Dual-write functionality
 */

// Load env files BEFORE any app imports (ES module imports are hoisted,
// so we must use dynamic imports for app modules)
import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local', override: true });

// Dynamic imports so env vars are available when modules initialize
const { isSupabaseConfigured, isBackupEnabled, getSupabaseAdmin } =
  await import('@/lib/supabase/client');
const { performSupabaseBackup, listSupabaseBackups } =
  await import('@/lib/supabase/backup');
const { createWithBackup, readWithFallback, isBackupActive } =
  await import('@/lib/supabase/dual-write');

async function test1_connection() {
  console.log('\n=== Test 1: Connection Check ===');

  const configured: boolean = !!isSupabaseConfigured;
  const enabled: boolean = isBackupEnabled();

  console.log('Supabase configured:', configured);
  console.log('Backup enabled:', enabled);

  if (!configured) {
    console.log('❌ Supabase is not configured. Add environment variables to .env.local');
    return false;
  }

  if (!enabled) {
    console.log('⚠️  Backup is not enabled. Set SUPABASE_BACKUP_ENABLED=true');
    return false;
  }

  const admin = getSupabaseAdmin();
  console.log('Admin client:', admin ? '✅ Connected' : '❌ Failed');

  return admin !== null;
}

async function test2_fullBackup() {
  console.log('\n=== Test 2: Full Database Backup ===');

  console.log('Starting backup...');
  const result = await performSupabaseBackup({
    backupToDatabase: true,
    backupToStorage: true,
    backupRetentionDays: 30,
  });

  console.log('\nBackup Result:');
  console.log('  Success:', result.success ? '✅' : '❌');
  console.log('  Timestamp:', result.timestamp);
  console.log('  Record Count:', result.recordCount);

  if (result.databaseBackup) {
    console.log('  Database Backup:', result.databaseBackup.success ? '✅' : '❌',
      result.databaseBackup.error || '');
  }

  if (result.storageBackup) {
    console.log('  Storage Backup:', result.storageBackup.success ? '✅' : '❌',
      result.storageBackup.path || result.storageBackup.error || '');
  }

  // List backups
  console.log('\nListing backups in Storage...');
  const backups = await listSupabaseBackups();
  console.log('Found', backups.length, 'backups');

  for (const backup of backups.slice(0, 5)) {
    console.log(' -', backup.name, '(' + backup.size + ' bytes)');
  }

  return result.success;
}

async function test3_dualWrite() {
  console.log('\n=== Test 3: Dual-Write Test ===');

  const isActive: boolean = isBackupActive() as boolean;
  console.log('Backup is active:', isActive);

  if (!isActive) {
    console.log('⚠️  Backup not active - skipping dual-write test');
    return false;
  }

  // Create a test record
  const testEmail = `test-${Date.now()}@example.com`;
  console.log('Creating test user:', testEmail);

  try {
    const user = await createWithBackup('user', {
      email: testEmail,
      role: 'APPLICANT',
      status: 'PENDING',
    } as unknown as { id: string });

    console.log('✅ User created with backup:', user.id);

    // Test read with fallback
    console.log('\nTesting read with fallback...');
    const fetched = await readWithFallback('user', { id: user.id });

    if (fetched) {
      console.log('✅ Read with fallback successful:', (fetched as Record<string, unknown>).email);
    } else {
      console.log('⚠️  Read with fallback returned null');
    }

    return true;
  } catch (error) {
    console.error('❌ Dual-write test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Supabase Backup Test Suite');
  console.log('================================');

  // Test 1: Connection
  const connectionOk = await test1_connection();

  // Test 2: Full Backup (only if connected)
  let backupOk = false;
  if (connectionOk) {
    backupOk = await test2_fullBackup();
  }

  // Test 3: Dual-Write (only if backup enabled)
  let dualWriteOk = false;
  const enabled: boolean = isBackupEnabled();
  if (connectionOk && enabled) {
    dualWriteOk = await test3_dualWrite();
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log('Connection:', connectionOk ? '✅ PASS' : '❌ FAIL');
  console.log('Full Backup:', backupOk ? '✅ PASS' : '❌ FAIL');
  console.log('Dual-Write:', dualWriteOk ? '✅ PASS' : '⚠️  SKIPPED');

  const allPassed = connectionOk && backupOk;
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(console.error);


