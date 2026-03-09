import prisma from './lib/prisma/client.js';

async function check() {
  const settings = await prisma.systemSetting.findMany();
  console.log("System Settings:", settings.filter(s => s.key === 'registration_fee' || s.key === 'registration_currency'));
  
  const user = await prisma.user.findFirst({
    where: { role: 'APPLICANT' },
    select: { email: true, registrationFee: true, registrationCurrency: true }
  });
  console.log("Test Applicant:", user);
}

check().then(() => prisma.$disconnect());
