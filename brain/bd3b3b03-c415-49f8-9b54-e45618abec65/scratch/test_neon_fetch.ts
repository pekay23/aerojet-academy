import 'dotenv/config'

async function testFetch() {
  const connectionString = process.env.DATABASE_URL;
  // Neon HTTP API usually looks like this if using the serverless driver
  // But we can try a simple query via their HTTP proxy if enabled.
  // Actually, let's use the actual @neondatabase/serverless with fetch.
  
  console.log('Testing Neon HTTP/Fetch approach...');
  
  // This requires the neon serverless package
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(connectionString);
  
  try {
    const result = await sql`SELECT NOW()`;
    console.log('Success via HTTP/Fetch!', result);
  } catch (err) {
    console.error('HTTP/Fetch failed:', err.message);
  }
}

testFetch();
