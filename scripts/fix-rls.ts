import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()
  console.log('Connected to Supabase')

  // Fix internal_exam_bank_instructors policy
  try {
    await client.query(`
      CREATE POLICY "Instructors can view own assignments" ON public.internal_exam_bank_instructors
        FOR SELECT TO authenticated USING ("instructorId" = auth.uid()::text);
    `)
    console.log('✅ RLS policy created for internal_exam_bank_instructors')
  } catch (e: any) {
    console.log(`⚠️ internal_exam_bank_instructors: ${e.message}`)
  }

  // Verify all policies
  const policies = await client.query(`
    SELECT tablename, policyname, permissive, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename LIKE 'internal_exam%'
    ORDER BY tablename, cmd
  `)
  console.log('\nCurrent RLS policies:')
  policies.rows.forEach((r: any) => {
    console.log(`  ${r.tablename}: ${r.policyname} (${r.cmd})`)
  })

  await client.end()
  console.log('\nDone!')
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
