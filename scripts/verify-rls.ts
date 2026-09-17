import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Check is_admin_or_staff function
  const func = await client.query(`
    SELECT proname, prosrc FROM pg_proc WHERE proname = 'is_admin_or_staff'
  `)
  console.log('is_admin_or_staff function:')
  if (func.rows.length > 0) {
    console.log(`  Source: ${func.rows[0].prosrc?.substring(0, 200) || '(no source)'}`)
  } else {
    console.log('  NOT FOUND')
  }

  // Verify RLS policies on exam tables
  const policies = await client.query(`
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename LIKE 'internal_exam%'
    ORDER BY tablename, cmd
  `)
  console.log('\nExam table RLS policies:')
  policies.rows.forEach((r: unknown) => {
    console.log(`\n  ${(r as Record<string, unknown>).tablename}: ${(r as Record<string, unknown>).policyname} (${(r as Record<string, unknown>).cmd})`)
    console.log(`    qual: ${(r as Record<string, unknown>).qual || '(none)'}`)
    console.log(`    with_check: ${(r as Record<string, unknown>).with_check || '(none)'}`)
  })

  // Verify Realtime publication
  const pubTables = await client.query(`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename
  `)
  console.log('\nRealtime tables:')
  pubTables.rows.forEach((r: unknown) => console.log(`  - ${(r as Record<string, unknown>).tablename}`))

  await client.end()
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



