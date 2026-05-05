import { prismaBase } from './lib/prisma/db-base';

async function main() {
  console.log('--- START TEST ---');
  try {
    const count = await prismaBase.user.count();
    console.log('SUCCESS! User count:', count);
  } catch (err) {
    console.error('ERROR DETECTED:', err.message);
    if (err.stack) console.error(err.stack);
  }
  console.log('--- END TEST ---');
}

main().finally(() => process.exit());
