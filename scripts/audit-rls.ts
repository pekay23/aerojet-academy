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
  policies.rows.forEach((r: any) => {
    console.log(`\nTable: ${r.tablename}`)
    console.log(`  Policy: ${r.policyname}`)
    console.log(`  Command: ${r.cmd}`)
    console.log(`  Permissive: ${r.permissive}`)
    console.log(`  Qual: ${r.qual || '(none)'}`)
    console.log(`  With Check: ${r.with_check || '(none)'}`)
  })

  // Get tables with RLS enabled
  const tablesWithRLS = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true ORDER BY tablename
  `)
  console.log('\n' + '='.repeat(80))
  console.log(`\nTables with RLS enabled (${tablesWithRLS.rows.length}):`)
  tablesWithRLS.rows.forEach((r: any) => console.log(`  - ${r.tablename}`))

  await client.end()
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
