import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Check RLS on internal_exam_reports
  const tables = ['internal_exam_reports', 'internal_exam_questions']
  for (const table of tables) {
    const rls = await client.query(`
      SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1
    `, [table])
    console.log(`${table} RLS enabled: ${rls.rows[0]?.rowsecurity || false}`)
    
    const policies = await client.query(`
      SELECT policyname, cmd FROM pg_policies WHERE tablename = $1
    `, [table])
    console.log(`  Policies: ${policies.rows.map((r: unknown) => `${r.policyname} (${r.cmd})`).join(', ') || 'none'}`)
  }

  await client.end()
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



