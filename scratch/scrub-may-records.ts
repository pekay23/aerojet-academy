import prisma from '../lib/prisma/client';

async function scrubMaySecondRecords() {
  try {
    const emails = [
      "e.kwarteng@aerojet-academy.com",
      "p.wiafe@aerojet-academy.com",
      "e.avege@aerojet-academy.com",
      "b.bandor@aerojet-academy.com",
      "f.ampeh@aerojet-academy.com",
      "d.korku@aerojet-academy.com",
      "a.adam@aerojet-academy.com",
      "d.archer@aerojet-academy.com"
    ];

    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true }
    });

    const userIds = users.map(u => u.id);

    // Any record created in May 2026 is an erroneous artifact from the bug
    const startDate = new Date('2026-05-01T00:00:00Z');
    const endDate = new Date('2026-05-05T00:00:00Z');

    const deletedBookings = await prisma.examBooking.deleteMany({
      where: {
        userId: { in: userIds },
        createdAt: { gte: startDate, lt: endDate }
      }
    });

    const deletedResults = await prisma.examResult.deleteMany({
      where: {
        userId: { in: userIds },
        createdAt: { gte: startDate, lt: endDate }
      }
    });
    
    // Also check exam attendances just in case
    const deletedAttendances = await prisma.examAttendance.deleteMany({
      where: {
        userId: { in: userIds },
        createdAt: { gte: startDate, lt: endDate }
      }
    });

    console.log(`Scrubbed Erroneous May Records:`);
    console.log(`- Deleted Bookings: ${deletedBookings.count}`);
    console.log(`- Deleted Results: ${deletedResults.count}`);
    console.log(`- Deleted Attendances: ${deletedAttendances.count}`);

  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

scrubMaySecondRecords();
