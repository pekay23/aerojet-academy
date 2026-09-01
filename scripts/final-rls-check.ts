import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Check all internal_exam tables in Realtime
  const pubTables = await client.query(`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename LIKE 'internal_exam%'
  `)
  
  console.log('Internal exam tables in Realtime:')
  for (const row of pubTables.rows) {
    const table = row.tablename
    const rls = await client.query(`SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1`, [table])
    const policies = await client.query(`SELECT policyname, cmd FROM pg_policies WHERE tablename = $1`, [table])
    
    console.log(`\n${table}:`)
    console.log(`  RLS: ${rls.rows[0]?.rowsecurity || false}`)
    console.log(`  Policies: ${policies.rows.length}`)
    policies.rows.forEach((p: any) => console.log(`    - ${p.policyname} (${p.cmd})`))
  }

  await client.end()
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
