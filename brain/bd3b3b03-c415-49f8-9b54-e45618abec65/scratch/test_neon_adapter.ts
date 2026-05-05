import { neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

async function test() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Testing with Neon Serverless Adapter...');
  console.log('URL:', connectionString);
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const count = await prisma.user.count();
    console.log('Success! User count:', count);
  } catch (err) {
    console.error('Neon Adapter failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
