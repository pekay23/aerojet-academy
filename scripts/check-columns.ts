import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  const tables = [
    'internal_exam_sessions',
    'internal_exam_answers',
    'internal_exam_violations',
    'internal_exam_access_codes',
    'internal_exam_registrations',
    'internal_exam_bank_instructors',
    'internal_exam_class_schedules',
    'internal_exam_rule_overrides',
  ]

  for (const table of tables) {
    const columns = await client.query(
      'SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
      [table]
    )
    console.log(`\n${table}:`)
    columns.rows.forEach((r: unknown) => console.log(`  - ${r.column_name}`))
  }

  await client.end()
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



