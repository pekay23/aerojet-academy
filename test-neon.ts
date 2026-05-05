import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

async function test() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testing Neon Pool...');
  console.log('URL defined:', !!connectionString);
  
  const pool = new Pool({ connectionString });
  try {
    const client = await pool.connect();
    console.log('Connected!');
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('Pool failed:', err.message);
  } finally {
    await pool.end();
  }
}

test();
