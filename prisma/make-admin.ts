import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = "floowdis@gmail.com"; // YOUR EMAIL HERE

  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`✅ User ${email} is now an ADMIN.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
