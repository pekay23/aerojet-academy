const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  console.log('Attempting to connect to DB...');
  try {
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT email, role FROM users WHERE role = \'ADMIN\'');
    console.log('Admins found:', res.rows);
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

test();
