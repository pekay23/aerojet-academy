import postgres from 'postgres'

const url = process.env.SUPABASE_DATABASE_URL
if (!url) { console.error('SUPABASE_DATABASE_URL not set'); process.exit(1) }

console.log('Connecting to:', url.replace(/:[^:@]+@/, ':****@'))

const sql = postgres(url, { ssl: 'require', connect_timeout: 10 })

try {
  const result = await sql`SELECT NOW() as time, current_user as user, current_database() as db`
  console.log('✅ SUCCESS!', result[0])
} catch (err) {
  console.error('❌ Failed:', err.message)
} finally {
  await sql.end()
}
