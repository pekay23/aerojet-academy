import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  )
  console.log('All tables in Supabase:')
  tables.rows.forEach((r: any) => console.log('  -', r.table_name))

  await client.end()
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
