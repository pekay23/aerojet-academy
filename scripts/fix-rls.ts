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
  } catch (e: unknown) {
    console.log(`⚠️ internal_exam_bank_instructors: ${(e as Error).message}`)
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
  policies.rows.forEach((r: unknown) => {
    console.log(`  ${(r as Record<string, unknown>).tablename}: ${(r as Record<string, unknown>).policyname} (${(r as Record<string, unknown>).cmd})`)
  })

  await client.end()
  console.log('\nDone!')
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



