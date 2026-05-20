import postgres from 'postgres';

async function test() {
  const connectionString = "postgresql://postgres.actbrdmjmfnhxbscuotz:Morph232*234@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require";
  console.log("Connecting using postgres library to:", connectionString.split('@')[1]);
  
  const sql = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    connect_timeout: 10
  });

  try {
    const result = await sql`SELECT NOW()`;
    console.log("SUCCESS! Connection established. Server time:", result[0].now);
  } catch (err) {
    console.error("Connection failed using postgres library:", err.message);
  } finally {
    await sql.end();
  }
}

test();
