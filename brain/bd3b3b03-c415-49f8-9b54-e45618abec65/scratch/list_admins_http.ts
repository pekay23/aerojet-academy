import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const users = await sql`SELECT email, role, status FROM users WHERE role = 'ADMIN'`;
    console.log('--- ADMIN USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-------------------');
  } catch (err) {
    console.error('Error listing admins:', err.message);
  }
}
main();
