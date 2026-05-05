const { Client } = require('pg');
require('dotenv').config();

// Try to connect without SSL first to see if that's the issue (though Neon usually requires it)
const client = new Client({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function test() {
  console.log('Attempting to connect to DB (No SSL config in PG client)...');
  try {
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Result:', res.rows[0]);
  } catch (err) {
    console.error('Connection error:', err.message);
    
    console.log('Retrying with SSL: require...');
    const clientSsl = new Client({
      connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await clientSsl.connect();
      console.log('Connected successfully with SSL!');
      const res = await clientSsl.query('SELECT NOW()');
      console.log('Result:', res.rows[0]);
    } catch (err2) {
      console.error('SSL Connection error:', err2.message);
    } finally {
      await clientSsl.end();
    }
  } finally {
    await client.end();
  }
}

test();
