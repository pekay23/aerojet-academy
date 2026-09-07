import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  const columns = await client.query(
    'SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
    ['internal_exam_banks']
  )
  console.log('internal_exam_banks columns:')
  columns.rows.forEach((r: unknown) => console.log(`  - ${r.column_name}`))

  await client.end()
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



