import pg from 'pg';
const { Client } = pg;

const url = "postgresql://postgres.actbrdmjmfnhxbscuotz:Morph232*234@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require";
const parsed = new URL(url);

const client = new Client({
  host: parsed.hostname,
  port: parsed.port || 5432,
  database: parsed.pathname.replace('/', ''),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("SUCCESSFULLY CONNECTED!");
    const res = await client.query("SELECT NOW()");
    console.log("Result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

run();
