const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.walletTransaction.count();
  console.log('Wallet tx:', count);
  const payments = await prisma.payment.count();
  console.log('Payments:', payments);
  const approved = await prisma.payment.count({where:{status:'APPROVED'}});
  console.log('Approved payments:', approved);
  const noApprovedAt = await prisma.payment.count({where:{status:'APPROVED', approvedAt: null}});
  console.log('Approved without approvedAt:', noApprovedAt);
}
main().finally(() => prisma.$disconnect());
