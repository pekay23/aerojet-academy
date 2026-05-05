import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'

async function seedAdmin() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Seeding admin via Neon HTTP/Fetch...');
  
  const sql = neon(connectionString);
  const email = 'admin@aerojet-academy.com';
  const password = process.env.ADMIN_PASSWORD || 'REDACTED_PASSWORD';
  const adminPassword = await bcrypt.hash(password, 12);
  
  try {
    // Check if user exists
    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    
    if (users.length > 0) {
      console.log('User exists, updating password and status...');
      await sql`UPDATE users SET password = ${adminPassword}, status = 'ACTIVE' WHERE email = ${email}`;
    } else {
      console.log('User missing, creating base record...');
      const userId = crypto.randomUUID();
      await sql`INSERT INTO users (id, email, password, role, status, "emailVerified", "updatedAt") 
                VALUES (${userId}, ${email}, ${adminPassword}, 'ADMIN', 'ACTIVE', NOW(), NOW())`;
      
      // Also create profile
      await sql`INSERT INTO profiles (id, "userId", "firstName", "lastName", nationality, "updatedAt")
                VALUES (crypto.randomUUID(), ${userId}, 'Super', 'Admin', 'Ghanaian', NOW())`;
    }
    console.log('Admin user successfully ensured via HTTP!');
  } catch (err) {
    console.error('Seed failed:', err.message);
  }
}

seedAdmin();
