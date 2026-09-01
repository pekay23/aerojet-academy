import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()
  console.log('Connected to Supabase')

  // List tables
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  )
  console.log('Tables:', tables.rows.map((r: any) => r.table_name).join(', '))

  // Check Realtime publication
  const publications = await client.query(
    "SELECT pubname, tablename FROM pg_publication WHERE pubname = 'supabase_realtime'"
  )
  console.log('Realtime publication:', publications.rows.length > 0 ? 'EXISTS' : 'MISSING')

  // Check if internal_exam_sessions is in Realtime
  const realtimeTables = await client.query(
    "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'"
  )
  console.log('Realtime tables:', realtimeTables.rows.map((r: any) => r.tablename).join(', '))

  await client.end()
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
