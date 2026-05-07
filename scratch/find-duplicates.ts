import prisma from '../lib/prisma/client';
import fs from 'fs';

async function checkDuplicates() {
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
      where: {
        email: { in: emails }
      },
      include: {
        profile: true,
        examBookings: true,
        examResults: true
      }
    });

    const output = users.map(u => ({
      name: `${u.profile?.firstName} ${u.profile?.lastName}`,
      email: u.email,
      bookingCount: u.examBookings.length,
      resultCount: u.examResults.length,
      bookings: u.examBookings.map(b => ({
        id: b.id,
        examComponentId: b.examComponentId,
        moduleCode: b.moduleCode,
        status: b.status,
        createdAt: b.createdAt
      })),
      results: u.examResults.map(r => ({
        id: r.id,
        examId: r.examId,
        score: r.score,
        createdAt: r.createdAt
      }))
    }));

    fs.writeFileSync('scratch/officer-dupes.json', JSON.stringify(output, null, 2));
    console.log(`Wrote duplicates analysis to scratch/officer-dupes.json`);

  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
