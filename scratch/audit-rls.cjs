const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function main() {
  try {
    // 1. Check which tables have RLS enabled
    console.log('=== RLS STATUS PER TABLE ===');
    const rlsStatus = await pool.query(
      "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    rlsStatus.rows.forEach(row => {
      console.log(`  ${row.tablename}: RLS=${row.rowsecurity}`);
    });

    // 2. Check RLS policies
    console.log('\n=== RLS POLICIES ===');
    const policies = await pool.query(
      "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname"
    );
    policies.rows.forEach(row => {
      console.log(`  [${row.tablename}] ${row.policyname} (${row.cmd}) permissive=${row.permissive}`);
      console.log(`    roles: ${row.roles}`);
      console.log(`    USING: ${row.qual}`);
      if (row.with_check) console.log(`    WITH CHECK: ${row.with_check}`);
    });

    // 3. Check helper functions
    console.log('\n=== HELPER FUNCTIONS ===');
    const funcs = await pool.query(
      "SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('current_app_user_id', 'current_app_user_role', 'is_admin_or_staff')"
    );
    funcs.rows.forEach(row => {
      console.log(`  ${row.routine_name}: ${row.routine_definition}`);
    });

    // 4. Test what happens with no session vars set (simulates unauthenticated)
    console.log('\n=== TEST: No session vars (anonymous) ===');
    const anonTest = await pool.query("SELECT current_setting('aerojet.user_id', true) as uid, current_setting('aerojet.user_role', true) as role");
    console.log('  user_id:', JSON.stringify(anonTest.rows[0].uid));
    console.log('  user_role:', JSON.stringify(anonTest.rows[0].role));

    // 5. Test with session vars set
    console.log('\n=== TEST: With admin session vars ===');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('aerojet.user_id', 'test-admin-id', true)");
      await client.query("SELECT set_config('aerojet.user_role', 'ADMIN', true)");
      const testResult = await client.query("SELECT current_setting('aerojet.user_id', true) as uid, current_setting('aerojet.user_role', true) as role");
      console.log('  user_id:', testResult.rows[0].uid);
      console.log('  user_role:', testResult.rows[0].role);
      
      const isAdminResult = await client.query("SELECT is_admin_or_staff() as is_staff");
      console.log('  is_admin_or_staff():', isAdminResult.rows[0].is_staff);
      
      // Test actual row count visibility
      const userCount = await client.query("SELECT count(*) as cnt FROM users");
      console.log('  Users visible as ADMIN:', userCount.rows[0].cnt);
      
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    // 6. Test with empty/null session (simulates broken RLS extension)
    console.log('\n=== TEST: With empty session vars ===');
    const client2 = await pool.connect();
    try {
      await client2.query('BEGIN');
      // Don't set any vars - simulates when RLS extension fails to inject
      const userCount2 = await client2.query("SELECT count(*) as cnt FROM users");
      console.log('  Users visible with no vars:', userCount2.rows[0].cnt);
      await client2.query('ROLLBACK');
    } finally {
      client2.release();
    }

    // 7. Check all tables that have RLS but NO policies
    console.log('\n=== TABLES WITH RLS BUT NO POLICIES ===');
    const missingPolicies = await pool.query(`
      SELECT t.tablename 
      FROM pg_tables t 
      LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
      WHERE t.schemaname = 'public' AND t.rowsecurity = true AND p.policyname IS NULL
      ORDER BY t.tablename
    `);
    if (missingPolicies.rows.length === 0) {
      console.log('  None - all RLS-enabled tables have policies');
    } else {
      missingPolicies.rows.forEach(row => {
        console.log('  WARNING: ' + row.tablename + ' has RLS enabled but NO policies!');
      });
    }

    // 8. Check table owner vs connection role
    console.log('\n=== TABLE OWNERSHIP ===');
    const ownership = await pool.query(
      "SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true ORDER BY tablename"
    );
    ownership.rows.forEach(row => {
      console.log(`  ${row.tablename}: owner=${row.tableowner}`);
    });

    const currentRole = await pool.query("SELECT current_user, session_user");
    console.log('\n  Current user:', currentRole.rows[0].current_user);
    console.log('  Session user:', currentRole.rows[0].session_user);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
