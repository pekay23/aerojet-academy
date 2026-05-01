import 'dotenv/config';
import pg from 'pg';

async function test() {
  const connectionString = process.env.DIRECT_URL;
  console.log('Testing connection to DIRECT_URL:', connectionString.split('@')[1]);
  
  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    const start = Date.now();
    const client = await pool.connect();
    console.log('Connected in', Date.now() - start, 'ms');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

test();
