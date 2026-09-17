import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Get all RLS policies
  const policies = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, cmd
  `)

  console.log('All RLS policies in Supabase:')
  console.log('='.repeat(80))
  policies.rows.forEach((r: unknown) => {
    console.log(`\nTable: ${(r as Record<string, unknown>).tablename}`)
    console.log(`  Policy: ${(r as Record<string, unknown>).policyname}`)
    console.log(`  Command: ${(r as Record<string, unknown>).cmd}`)
    console.log(`  Permissive: ${(r as Record<string, unknown>).permissive}`)
    console.log(`  Qual: ${(r as Record<string, unknown>).qual || '(none)'}`)
    console.log(`  With Check: ${(r as Record<string, unknown>).with_check || '(none)'}`)
  })

  // Get tables with RLS enabled
  const tablesWithRLS = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true ORDER BY tablename
  `)
  console.log('\n' + '='.repeat(80))
  console.log(`\nTables with RLS enabled (${tablesWithRLS.rows.length}):`)
  tablesWithRLS.rows.forEach((r: unknown) => console.log(`  - ${(r as Record<string, unknown>).tablename}`))

  await client.end()
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



