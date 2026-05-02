
import { prismaUnfiltered as prisma } from '../lib/prisma/client';

async function main() {
  console.log('--- ENROLLMENTS WITH 0 OR NULL PAID ---');
  const enrollments = await prisma.enrollment.findMany({
    where: {
      OR: [
        { amountPaid: null },
        { amountPaid: 0 }
      ]
    },
    include: {
      user: {
        include: {
          profile: true
        }
      },
      course: true
    }
  });

  console.log(`Found ${enrollments.length} such enrollments.`);
  enrollments.forEach(e => {
    console.log(`ID: ${e.id}, Student: ${e.user?.profile?.firstName} ${e.user?.profile?.lastName} (${e.user?.email}), Course: ${e.course?.name}, Status: ${e.status}, Price: ${e.course?.price}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
