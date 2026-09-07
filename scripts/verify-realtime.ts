import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Check Realtime publication tables
  const pubTables = await client.query(`
    SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename
  `)
  console.log('Realtime tables:')
  pubTables.rows.forEach((r: unknown) => console.log(`  - ${(r as Record<string, unknown>).tablename}`))

  await client.end()
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



