import prisma from '../lib/prisma/client'

async function countRecords() {
  const allBookings = await prisma.examBooking.findMany({
    include: { user: { select: { email: true } } }
  });
  console.log('Total ExamBookings:', allBookings.length);
  const allResults = await prisma.examResult.findMany();
  console.log('Total ExamResults:', allResults.length);
  
  const emptyResults = allResults.filter(r => !r.moduleCode);
  console.log('Results missing moduleCode:', emptyResults.length);
  
  const emptyBookings = allBookings.filter(b => !b.moduleCode);
  console.log('Bookings missing moduleCode:', emptyBookings.length);

  // Let's check for duplicates where multiple bookings or results exist on the same date for the same user without moduleCode or something
  // Or check if the user literally means that when they use `createExamRecord`, it duplicates.
  // We modified `createExamRecord` earlier today to create both a booking and a result!
  // Wait! Did they use `createExamRecord` *after* my fix, and my fix caused duplicates?
  // Let's see all records created today!
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const recentResults = allResults.filter(r => r.createdAt >= today);
  console.log('Recent ExamResults (today):', recentResults.length);
  
  const recentBookings = allBookings.filter(b => b.createdAt >= today);
  console.log('Recent ExamBookings (today):', recentBookings.length);

  if (recentResults.length > 0) {
    console.log('\nRecent Results:');
    for (const r of recentResults) {
      console.log(`- ID: ${r.id} | User: ${r.userId} | Module: ${r.moduleCode} | Score: ${r.score} | Passed: ${r.passed}`);
    }
  }

  if (recentBookings.length > 0) {
    console.log('\nRecent Bookings:');
    for (const b of recentBookings) {
      console.log(`- ID: ${b.id} | User: ${b.user.email} | Module: ${b.moduleCode} | Score: ${b.score} | Result: ${b.result}`);
    }
  }

  await prisma.$disconnect()
}

countRecords().catch(console.error)


