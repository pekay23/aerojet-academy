import postgres from 'postgres';
const n = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const r = await n`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
console.log(r.map(x => x.table_name).join('\n'));
await n.end();
