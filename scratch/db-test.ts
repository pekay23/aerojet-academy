import { Client } from 'pg';
import 'dotenv/config';

async function testConnection() {
  const url = process.env.DIRECT_URL;
  console.log('Testing connection to:', url?.split('@')[1]);

  const client = new Client({
    connectionString: url,
  });

  try {
    await client.connect();
    console.log('✅ Success! Node.js can connect to the database.');
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);
    await client.end();
  } catch (err: any) {
    console.error('❌ Connection failed!');
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    process.exit(1);
  }
}

testConnection();
