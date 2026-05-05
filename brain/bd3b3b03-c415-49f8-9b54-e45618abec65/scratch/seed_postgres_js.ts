import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL, {
  ssl: 'require'
})

async function main() {
  const email = 'admin@aerojet-academy.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin@2026'
  console.log(`Ensuring admin: ${email} using postgres.js`)

  const adminPassword = await bcrypt.hash(password, 12)
  
  const users = await sql`SELECT id FROM users WHERE email = ${email}`
  
  if (users.length > 0) {
    console.log('User exists, updating password...')
    await sql`UPDATE users SET password = ${adminPassword}, status = 'ACTIVE' WHERE email = ${email}`
  } else {
    console.log('User missing, creating...')
    // This is simplified, might fail if other tables are needed, but let's try
    await sql`INSERT INTO users (id, email, password, role, status, "updatedAt") VALUES (gen_random_uuid()::text, ${email}, ${adminPassword}, 'ADMIN', 'ACTIVE', NOW())`
  }
  
  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => sql.end())
