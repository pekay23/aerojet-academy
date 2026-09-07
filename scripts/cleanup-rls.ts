import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Drop ALL existing policies on exam tables
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

  const droppedPolicies: string[] = []
  for (const table of tables) {
    const policies = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = $1
    `, [table])
    
    for (const policy of policies.rows) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.${table}`)
        droppedPolicies.push(`${table}: ${policy.policyname}`)
      } catch (e: unknown) {
        console.log(`⚠️ Failed to drop ${policy.policyname}: ${(e as Error).message}`)
      }
    }
  }

  console.log(`Dropped ${droppedPolicies.length} old policies`)
  
  // Create clean RLS policies
  const newPolicies = [
    {
      table: 'internal_exam_sessions',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_sessions FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_sessions FOR SELECT TO anon USING (true);
      `,
    },
    {
      table: 'internal_exam_answers',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_answers FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_answers FOR SELECT TO anon USING (true);
      `,
    },
    {
      table: 'internal_exam_violations',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_violations FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_violations FOR SELECT TO anon USING (true);
      `,
    },
    {
      table: 'internal_exam_access_codes',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_access_codes FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_access_codes FOR SELECT TO anon USING (true);
      `,
    },
    {
      table: 'internal_exam_registrations',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_registrations FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_registrations FOR SELECT TO anon USING (true);
      `,
    },
    {
      table: 'internal_exam_bank_instructors',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_bank_instructors FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_bank_instructors FOR SELECT TO anon USING (true);
      `,
    },
    {
      table: 'internal_exam_class_schedules',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_class_schedules FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_class_schedules FOR SELECT TO anon USING (true);
      `,
    },
    {
      table: 'internal_exam_rule_overrides',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_rule_overrides FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_rule_overrides FOR SELECT TO anon USING (true);
      `,
    },
  ]

  for (const policy of newPolicies) {
    try {
      await client.query(policy.sql)
      console.log(`✅ Clean policies created for ${policy.table}`)
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



