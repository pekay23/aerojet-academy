
import { prismaUnfiltered as prisma } from '../lib/prisma/client';

async function main() {
  console.log('🛠 Deep Backfill: Updating ALL Enrollment amountPaid...');

  const enrollments = await prisma.enrollment.findMany({
    where: {
      OR: [
        { amountPaid: null },
        { amountPaid: 0 }
      ]
    },
    include: {
      course: true
    }
  });

  console.log(`Found ${enrollments.length} enrollments to update.`);

  for (const e of enrollments) {
    const price = e.course.price || 0;
    if (Number(price) > 0) {
      await prisma.enrollment.update({
        where: { id: e.id },
        data: { amountPaid: price }
      });
      console.log(`Updated enrollment ${e.id} [${e.status}] for course ${e.course.name} with price €${price}`);
    }
  }

  console.log('✅ Deep Backfill completed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
