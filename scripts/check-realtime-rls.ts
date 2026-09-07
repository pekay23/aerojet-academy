import { Client } from 'pg'

const client = new Client({ connectionString: process.env.SUPABASE_DATABASE_URL })

async function main() {
  await client.connect()

  // Check messages RLS policy (existing Realtime table)
  const messagesPolicy = await client.query(`
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'messages'
  `)
  console.log('Messages RLS policies:')
  messagesPolicy.rows.forEach((r: unknown) => {
    console.log(`  ${r.policyname} (${r.cmd}):`)
    console.log(`    qual: ${r.qual || '(none)'}`)
    console.log(`    with_check: ${r.with_check || '(none)'}`)
  })

  // Check if there's a function for current_app_user_id
  const funcs = await client.query(`
    SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%app_user%' OR proname LIKE '%current_user%'
  `)
  console.log('\nAuth helper functions:')
  funcs.rows.forEach((r: unknown) => console.log(`  ${r.proname}: ${r.prosrc?.substring(0, 100) || '(no source)'}`))

  await client.end()
}

main().catch(e => {
  console.error('Error:', (e as Error).message)
  process.exit(1)
})



