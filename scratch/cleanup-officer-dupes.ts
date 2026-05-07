import prisma from '../lib/prisma/client';

async function cleanupDuplicates() {
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
      include: {
        examBookings: {
          include: { examComponent: { include: { course: true } } }
        },
        examResults: true
      }
    });

    let deletedBookings = 0;
    let deletedResults = 0;

    for (const user of users) {
      console.log(`\nProcessing ${user.email}...`);

      // 1. CLEANUP EXAM BOOKINGS
      // Group by effective module code
      const bookingGroups = new Map<string, typeof user.examBookings>();
      for (const b of user.examBookings) {
        const moduleCode = b.moduleCode || b.examComponent?.course?.code;
        if (!moduleCode) continue; // Skip if we can't identify the module

        if (!bookingGroups.has(moduleCode)) {
          bookingGroups.set(moduleCode, []);
        }
        bookingGroups.get(moduleCode)!.push(b);
      }

      for (const [moduleCode, bookings] of bookingGroups.entries()) {
        if (bookings.length > 1) {
          // Sort by createdAt ascending (keep oldest)
          bookings.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          
          // Keep the first one, delete the rest
          const toDelete = bookings.slice(1);
          for (const b of toDelete) {
            console.log(`  Deleting duplicate booking ${b.id} for module ${moduleCode}`);
            await prisma.examBooking.delete({ where: { id: b.id } });
            deletedBookings++;
          }
        }
      }

      // 2. CLEANUP EXAM RESULTS
      // Group exact duplicates (same score, same date)
      // Particularly target the null score ones created on May 2nd
      const resultGroups = new Map<string, typeof user.examResults>();
      for (const r of user.examResults) {
        // Group key: examId + score + date(YYYY-MM-DD)
        const key = `${r.examId || 'null'}_${r.score ? r.score.toString() : 'null'}_${r.createdAt.toISOString().split('T')[0]}`;
        if (!resultGroups.has(key)) {
          resultGroups.set(key, []);
        }
        resultGroups.get(key)!.push(r);
      }

      for (const [key, results] of resultGroups.entries()) {
        if (results.length > 1) {
          // If they are null score duplicates from May, we can safely delete all but one
          // Keep the first one
          const toDelete = results.slice(1);
          for (const r of toDelete) {
            console.log(`  Deleting duplicate result ${r.id} (Key: ${key})`);
            await prisma.examResult.delete({ where: { id: r.id } });
            deletedResults++;
          }
        }
      }
    }

    console.log(`\nCleanup complete! Deleted ${deletedBookings} bookings and ${deletedResults} results.`);

  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();
