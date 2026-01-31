import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Exam seed...');

  // --- 1. Exam Rooms ---
  const roomA = await prisma.examRoom.upsert({
    where: { code: 'ROOM-A' },
    update: {},
    create: { name: 'Exam Hall A', code: 'ROOM-A', capacity: 28 }
  });

  // --- 2. Exam Windows (2026) ---
  const windows = [
    { start: new Date('2026-06-23'), end: new Date('2026-06-24'), cutoff: new Date('2026-06-02') }, // Jun 26
    { start: new Date('2026-09-14'), end: new Date('2026-09-15'), cutoff: new Date('2026-08-24') }, // Sep 26
  ];

  // --- 3. Create Scheduled Runs for M1 & M2 ---
  // We need the Module IDs first
  const m1 = await prisma.course.findFirst({ where: { code: 'MOD-01' } });
  const m2 = await prisma.course.findFirst({ where: { code: 'MOD-02' } });

  if (m1 && m2) {
    // Schedule M1 in June Window
    await prisma.examRun.create({
      data: {
        examModuleId: m1.id,
        roomId: roomA.id,
        startDatetime: new Date('2026-06-23T09:00:00Z'), // 9 AM
        durationMinutes: 60, // 1 hour
        maxCapacity: 28,
        status: 'SCHEDULED'
      }
    });

    // Schedule M2 in June Window
    await prisma.examRun.create({
      data: {
        examModuleId: m2.id,
        roomId: roomA.id,
        startDatetime: new Date('2026-06-23T11:00:00Z'), // 11 AM
        durationMinutes: 60,
        maxCapacity: 28,
        status: 'SCHEDULED'
      }
    });
    
    console.log('✅ Exam Runs scheduled.');
  } else {
    console.log('⚠️ Modules M1/M2 not found. Run the previous seed first?');
  }

  console.log('✅ Exam Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
