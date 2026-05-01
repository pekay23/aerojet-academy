import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  if (!connectionString) {
    console.error('SUPABASE_DATABASE_URL not found even in .env.local');
    return;
  }
  console.log('Testing connection to Supabase:', connectionString.split('@')[1]);
  
  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    const start = Date.now();
    const client = await pool.connect();
    console.log('Connected to Supabase in', Date.now() - start, 'ms');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Supabase Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

test();
