import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Drop existing restrictive policies on exam tables
  const tables = [
    'internal_exam_sessions',
    'internal_exam_answers',
    'internal_exam_violations',
    'internal_exam_access_codes',
    'internal_exam_registrations',
    'internal_exam_bank_instructors',
    'internal_exam_class_schedules',
    'internal_exam_rule_overrides',
  ]

  for (const table of tables) {
    try {
      await client.query(`
        DO $$
        DECLARE r record;
        FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = $1) LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, $1);
        END LOOP;
        $$;
      `, [table])
      console.log(`Dropped existing policies on ${table}`)
    } catch (_e: unknown) {
      // ignore
    }
  }

  // Create RLS policies aligned with app's auth model:
  // - Staff/admin: is_admin_or_staff()
  // - Student/instructor data: allow authenticated reads (Realtime client uses anon key)
  // - App's own auth (NextAuth + Prisma) is the primary security boundary
  // - RLS is defense-in-depth for Supabase Storage/Data API
  
  const policies = [
    // internal_exam_sessions
    {
      table: 'internal_exam_sessions',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_sessions
          FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_sessions
          FOR SELECT TO anon USING (true);
      `,
    },
    // internal_exam_answers
    {
      table: 'internal_exam_answers',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_answers
          FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_answers
          FOR SELECT TO anon USING (true);
      `,
    },
    // internal_exam_violations
    {
      table: 'internal_exam_violations',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_violations
          FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_violations
          FOR SELECT TO anon USING (true);
      `,
    },
    // internal_exam_access_codes
    {
      table: 'internal_exam_access_codes',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_access_codes
          FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_access_codes
          FOR SELECT TO anon USING (true);
      `,
    },
    // internal_exam_registrations
    {
      table: 'internal_exam_registrations',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_registrations
          FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_registrations
          FOR SELECT TO anon USING (true);
      `,
    },
    // internal_exam_bank_instructors
    {
      table: 'internal_exam_bank_instructors',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_bank_instructors
          FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_bank_instructors
          FOR SELECT TO anon USING (true);
      `,
    },
    // internal_exam_class_schedules
    {
      table: 'internal_exam_class_schedules',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_class_schedules
          FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_class_schedules
          FOR SELECT TO anon USING (true);
      `,
    },
    // internal_exam_rule_overrides
    {
      table: 'internal_exam_rule_overrides',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_rule_overrides
          FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_rule_overrides
          FOR SELECT TO anon USING (true);
      `,
    },
  ]

  for (const policy of policies) {
    try {
      await client.query(policy.sql)
      console.log(`✅ RLS policies created for ${policy.table}`)
    } catch (e: unknown) {
      console.log(`⚠️ ${policy.table}: ${(e as Error).message}`)
    }
  }

  await client.end()
  console.log('\nDone!')
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



