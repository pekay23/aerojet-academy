import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()
  console.log('Connected to Supabase')

  // Tables that exist and should be in Realtime
  const tablesToAdd = [
    'internal_exam_sessions',
    'internal_exam_answers',
    'internal_exam_violations',
    'internal_exam_reports',
    'internal_exam_access_codes',
    'internal_exam_registrations',
    'internal_exam_bank_instructors',
    'internal_exam_class_schedules',
    'internal_exam_rule_overrides',
    'exams',
    'exam_sittings',
    'exam_attendance',
    'exam_results',
    'exam_bookings',
    'exam_components',
    'exam_events',
    'exam_pools',
    'messages',
  ]

  for (const table of tablesToAdd) {
    try {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.${table}`)
      console.log(`✅ Added ${table} to Realtime`)
    } catch (e: unknown) {
      if ((e as Error).message.includes('already exists')) {
        console.log(`✓ ${table} already in Realtime`)
      } else {
        console.log(`⚠️ ${table}: ${(e as Error).message}`)
      }
    }
  }

  await client.end()
  console.log('\nDone!')
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



