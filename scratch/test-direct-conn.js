import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.actbrdmjmfnhxbscuotz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Morph232*234',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("SUCCESSFULLY CONNECTED DIRECTLY!");
    const res = await client.query("SELECT NOW()");
    console.log("Result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Direct connection failed:", err.message);
  }
}

run();
