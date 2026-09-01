import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Check Realtime publication tables
  const pubTables = await client.query(`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename
  `)
  console.log('Realtime tables:')
  pubTables.rows.forEach((r: any) => console.log(`  - ${r.tablename}`))

  await client.end()
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
