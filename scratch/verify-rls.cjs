const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

async function main() {
  try {
    // 1. RLS status
    console.log('=== RLS STATUS ===');
    const rls = await pool.query(
      "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    const rlsOn = rls.rows.filter(r => r.rowsecurity);
    const rlsOff = rls.rows.filter(r => !r.rowsecurity);
    console.log('  RLS ON (' + rlsOn.length + '):', rlsOn.map(r => r.tablename).join(', '));
    console.log('  RLS OFF (' + rlsOff.length + '):', rlsOff.map(r => r.tablename).join(', '));

    // 2. Policies
    console.log('\n=== POLICIES (' + (await pool.query("SELECT count(*) FROM pg_policies WHERE schemaname = 'public'")).rows[0].count + ' total) ===');
    const pols = await pool.query("SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname");
    pols.rows.forEach(r => console.log('  [' + r.tablename + '] ' + r.policyname + ' (' + r.cmd + ') roles=' + r.roles));

    // 3. Functions
    console.log('\n=== HELPER FUNCTIONS ===');
    for (const fn of ['current_app_user_id', 'current_app_user_role', 'is_admin_or_staff']) {
      try {
        await pool.query('SELECT ' + fn + '()');
        console.log('  ' + fn + '(): EXISTS ✅');
      } catch (e) {
        console.log('  ' + fn + '(): MISSING ❌ - ' + e.message);
      }
    }

    // 4. Role check
    console.log('\n=== APP_USER ROLE ===');
    const roleCheck = await pool.query("SELECT 1 FROM pg_roles WHERE rolname = 'app_user'");
    console.log('  app_user role exists:', roleCheck.rows.length > 0 ? '✅' : '❌');

    // 5. Test SET LOCAL ROLE
    console.log('\n=== TEST: SET LOCAL ROLE app_user ===');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL ROLE app_user');
      await client.query("SELECT set_config('aerojet.user_id', 'test-id', true)");
      await client.query("SELECT set_config('aerojet.user_role', 'ADMIN', true)");
      
      const isAdmin = await client.query('SELECT is_admin_or_staff() as v');
      console.log('  is_admin_or_staff() as ADMIN:', isAdmin.rows[0].v);
      
      const userCount = await client.query('SELECT count(*) as cnt FROM users');
      console.log('  Users visible as ADMIN:', userCount.rows[0].cnt);
      
      const courseCount = await client.query('SELECT count(*) as cnt FROM courses');
      console.log('  Courses visible (no RLS):', courseCount.rows[0].cnt);

      await client.query('ROLLBACK');
    } finally { client.release(); }

    // 6. Test as STUDENT
    console.log('\n=== TEST: SET LOCAL ROLE app_user (STUDENT) ===');
    const client2 = await pool.connect();
    try {
      await client2.query('BEGIN');
      await client2.query('SET LOCAL ROLE app_user');
      await client2.query("SELECT set_config('aerojet.user_id', 'nonexistent-student', true)");
      await client2.query("SELECT set_config('aerojet.user_role', 'STUDENT', true)");
      
      const userCount = await client2.query('SELECT count(*) as cnt FROM users');
      console.log('  Users visible as STUDENT (SELECT true):', userCount.rows[0].cnt);
      
      const profileCount = await client2.query('SELECT count(*) as cnt FROM profiles');
      console.log('  Profiles visible as nonexistent student:', profileCount.rows[0].cnt, '(should be 0)');

      const courseCount = await client2.query('SELECT count(*) as cnt FROM courses');
      console.log('  Courses visible (no RLS):', courseCount.rows[0].cnt);

      await client2.query('ROLLBACK');
    } finally { client2.release(); }

    // 7. Tables with RLS but no policy (should be 0 now)
    console.log('\n=== TABLES WITH RLS BUT NO POLICY ===');
    const missing = await pool.query(`
      SELECT t.tablename FROM pg_tables t
      LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
      WHERE t.schemaname = 'public' AND t.rowsecurity = true AND p.policyname IS NULL
    `);
    if (missing.rows.length === 0) {
      console.log('  None ✅');
    } else {
      missing.rows.forEach(r => console.log('  WARNING: ' + r.tablename + ' has RLS but NO policies ❌'));
    }

    console.log('\n=== VERIFICATION COMPLETE ===');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}
main();
