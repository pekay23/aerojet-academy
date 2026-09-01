import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Add RLS policies for tables in Realtime but without policies
  const policies = [
    {
      table: 'internal_exam_reports',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_reports FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_reports FOR SELECT TO anon USING (true);
      `,
    },
    {
      table: 'internal_exam_questions',
      sql: `
        CREATE POLICY "admin_all" ON public.internal_exam_questions FOR ALL TO authenticated USING (is_admin_or_staff());
        CREATE POLICY "realtime_read" ON public.internal_exam_questions FOR SELECT TO anon USING (true);
      `,
    },
  ]

  for (const policy of policies) {
    try {
      await client.query(policy.sql)
      console.log(`✅ RLS policies created for ${policy.table}`)
    } catch (e: any) {
      console.log(`⚠️ ${policy.table}: ${e.message}`)
    }
  }

  await client.end()
  console.log('\nDone!')
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
