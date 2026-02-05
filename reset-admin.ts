const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'floowdis@gmail.com'; // <--- PUT YOUR EMAIL HERE
  const password = '123';
  
  const hashedPassword = await hash(password, 10);
  
  await prisma.user.update({
    where: { email: email },
    data: { password: hashedPassword }
  });
  
  console.log(`Password for ${email} updated to: ${password}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
