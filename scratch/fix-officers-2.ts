import prisma from '../lib/prisma/client';

async function fixRemaining() {
  try {
    console.log('=== REMAINING FIXES ===\n');

    // =========================================================================
    // Prince Wiafe - M8 result + booking
    // =========================================================================
    console.log('--- Prince Wiafe ---');
    const princeM8Result = await prisma.examResult.findFirst({
      where: { userId: 'cmmk5k5wj001998fgxnwvwzvb', moduleCode: 'M8' }
    });
    if (!princeM8Result) {
      await prisma.examResult.create({
        data: {
          userId: 'cmmk5k5wj001998fgxnwvwzvb',
          moduleCode: 'M8',
          score: 75,
          percentage: 75,
          passed: true,
          attemptType: 'FIRST',
          createdAt: new Date('2025-08-15')
        }
      });
      console.log('  ✅ Created Prince M8 exam result (75%, passed)');
    } else {
      console.log('  ⏭ Prince M8 result already exists');
    }

    const princeM8Booking = await prisma.examBooking.findFirst({
      where: { userId: 'cmmk5k5wj001998fgxnwvwzvb', moduleCode: 'M8' }
    });
    if (!princeM8Booking) {
      await prisma.examBooking.create({
        data: {
          userId: 'cmmk5k5wj001998fgxnwvwzvb',
          moduleCode: 'M8',
          bookingType: 'TWIN_PACK',
          amountPaid: 780,
          status: 'COMPLETED',
          result: 'pass',
          score: 75,
          percentage: 75,
          attemptType: 'MIGRATED',
          isResit: false,
          guaranteeType: 'INDIVIDUAL_GUARANTEED',
          demandStatus: 'DEMAND_CAPTURED',
          examCategory: 'OFFICIAL_EASA'
        }
      });
      console.log('  ✅ Created Prince M8 COMPLETED booking');
    } else {
      console.log('  ⏭ Prince M8 booking already exists');
    }

    // Fix Prince M1 booking result
    await prisma.examBooking.update({
      where: { id: 'cmmxiktlh0004gwfgfg4rfn1l' },
      data: { result: 'pass', score: 75, percentage: 75, attemptType: 'MIGRATED' }
    });
    console.log('  ✅ Updated Prince M1 booking with pass result');

    // =========================================================================
    // Ebenezer Kwarteng - M8 booking
    // =========================================================================
    console.log('\n--- Ebenezer Kwarteng ---');
    const ebenezerM8 = await prisma.examBooking.findFirst({
      where: { userId: 'cmmk5kbnn001j98fg9itbokwz', moduleCode: 'M8' }
    });
    if (!ebenezerM8) {
      await prisma.examBooking.create({
        data: {
          userId: 'cmmk5kbnn001j98fg9itbokwz',
          moduleCode: 'M8',
          bookingType: 'TWIN_PACK',
          amountPaid: 780,
          status: 'COMPLETED',
          result: 'pass',
          score: 79,
          percentage: 79,
          attemptType: 'MIGRATED',
          isResit: false,
          guaranteeType: 'INDIVIDUAL_GUARANTEED',
          demandStatus: 'DEMAND_CAPTURED',
          examCategory: 'OFFICIAL_EASA'
        }
      });
      console.log('  ✅ Created Ebenezer M8 COMPLETED booking');
    } else {
      console.log('  ⏭ Ebenezer M8 booking already exists');
    }

    // Fix Ebenezer M1 booking result
    await prisma.examBooking.update({
      where: { id: 'cmmxikv410006gwfgig27lhpj' },
      data: { result: 'pass', score: 78, percentage: 78, attemptType: 'MIGRATED' }
    });
    console.log('  ✅ Updated Ebenezer M1 booking with pass result');

    // =========================================================================
    // David Archer wallet
    // =========================================================================
    console.log('\n--- David Archer ---');
    await prisma.walletTransaction.delete({ where: { id: 'cmo9ftb4600000sfgnok8qn7a' } }).catch(() => console.log('  ⏭ Erroneous debit already deleted'));
    await prisma.walletTransaction.delete({ where: { id: 'cmmkrgz6x00020ajovyxb5to2' } }).catch(() => console.log('  ⏭ Erroneous adjustment already deleted'));

    await prisma.wallet.update({
      where: { id: 'cmmk5jeal000398fg0dd4oz0j' },
      data: { balance: 2010, reservedBalance: 0, availableBalance: 2010 }
    });
    console.log('  ✅ David wallet corrected to 2010/0/2010');

    console.log('\n=== ALL REMAINING FIXES APPLIED ===');
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRemaining();
