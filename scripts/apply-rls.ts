import postgres from 'postgres'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('❌ No connection string found in environment.')
    process.exit(1)
  }

  const sql = postgres(connectionString, { ssl: 'require' })
  const sqlPath = path.join(process.cwd(), 'prisma/migrations/rls_setup.sql')
  const migrationSql = fs.readFileSync(sqlPath, 'utf8')

  console.log('--- Applying RLS Setup via direct connection ---')
  
  try {
    // postgres.js doesn't support multiple statements in one tagged template easily,
    // so we execute the raw string.
    await sql.unsafe(migrationSql)
    console.log('✅ RLS Setup applied successfully.')
  } catch (error) {
    console.error('❌ Failed to apply RLS setup:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main()


