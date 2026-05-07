import prisma from '../lib/prisma/client';

async function fix() {
  await prisma.walletTransaction.create({
    data: {
      walletId: 'cmmk5jeal000398fg0dd4oz0j',
      type: 'DEBIT',
      amount: 2010,
      description: 'Physical refund issued to student. Reason pending admin update.',
      balanceBefore: 2010,
      balanceAfter: 0,
      availableBefore: 2010,
      availableAfter: 0,
    }
  });
  await prisma.wallet.update({
    where: { id: 'cmmk5jeal000398fg0dd4oz0j' },
    data: { balance: 0, reservedBalance: 0, availableBalance: 0 }
  });
  console.log('Done: David Archer wallet set to €0, physical refund recorded.');
  await prisma.$disconnect();
}
fix();
