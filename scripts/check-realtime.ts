import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()
  console.log('Connected to Supabase')

  // Check Realtime publications
  const publications = await client.query("SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime'")
  console.log('Realtime publications:', JSON.stringify(publications.rows, null, 2))

  // Check publication tables with correct column names
  const pubTables = await client.query("SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'")
  console.log('Realtime tables count:', pubTables.rows.length)
  console.log('Realtime tables sample:', pubTables.rows.slice(0, 10).map((r: unknown) => JSON.stringify(r)).join(', '))

  // Check if our exam tables are in Realtime
  const examTables = ['internal_exam_sessions', 'internal_exam_answers', 'internal_exam_violations', 'exams', 'exam_sessions', 'exam_attempts']
  for (const table of examTables) {
    const found = pubTables.rows.find((r: unknown) => r.tablename === table)
    console.log(`${table} in Realtime: ${found ? 'YES' : 'NO'}`)
  }

  await client.end()
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



