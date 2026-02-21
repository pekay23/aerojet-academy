import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const modulesData = [
  { code: 'M1', name: 'Mathematics', category: 'Foundation' },
  { code: 'M2', name: 'Physics', category: 'Foundation' },
  { code: 'M3', name: 'Electrical Fundamentals', category: 'Foundation' },
  { code: 'M4', name: 'Electronic Fundamentals', category: 'Foundation' },
  { code: 'M5', name: 'Digital Techniques / Electronic Instrument Systems', category: 'Foundation' },
  { code: 'M6', name: 'Materials and Hardware', category: 'Foundation' },
  { code: 'M7', name: 'Maintenance Practices', category: 'Foundation' },
  { code: 'M8', name: 'Basic Aerodynamics', category: 'Foundation' },
  { code: 'M9', name: 'Human Factors', category: 'Foundation' },
  { code: 'M10', name: 'Aviation Legislation', category: 'Foundation' },
  { code: 'M11', name: 'Turbine Aeroplane Aerodynamics, Structures and Systems', category: 'Airframe' },
  { code: 'M13', name: 'Aircraft Aerodynamics, Structures and Systems', category: 'Powerplant' },
  { code: 'M15', name: 'Gas Turbine Engine', category: 'Powerplant' },
  { code: 'M17', name: 'Propeller', category: 'Powerplant' },
];

async function main() {
  console.log('🌱 Starting seed...');

  // --- 1. ADMIN USER ---
  console.log('👤 Seeding Admin User...');
  const password = await hash('123', 10);
  
  await prisma.user.upsert({
    where: { email: 'floowdis@gmail.com' },
    update: {},
    create: {
      email: 'floowdis@gmail.com',
      name: 'Super Admin',
      password: password,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // --- 2. MODULES ---
  console.log('📚 Seeding EASA Modules...');
  for (const mod of modulesData) {
    await prisma.module.upsert({
      where: { code: mod.code },
      update: {},
      create: {
        code: mod.code,
        name: mod.name,
        category: mod.category,
        durationMinutes: 180,
        isActive: true,
      },
    });
  }

  // --- 3. EXAM EVENTS (Replaces ExamWindow) ---
  console.log('📅 Seeding Exam Events...');
  
  // June 2026 Event
  const juneEvent = await prisma.examEvent.create({
    data: {
      name: 'June 2026 Exam Event',
      startDate: new Date('2026-06-23'),
      endDate: new Date('2026-06-24'),
      paymentDeadline: new Date('2026-06-02'), // T-21
      status: 'OPEN',
      minRevenueTarget: 25000.00
    }
  });

  // September 2026 Event
  await prisma.examEvent.create({
    data: {
      name: 'September 2026 Exam Event',
      startDate: new Date('2026-09-14'),
      endDate: new Date('2026-09-15'),
      paymentDeadline: new Date('2026-08-24'), // T-21
      status: 'DRAFT'
    }
  });

  // --- 4. EXAM POOLS (Replaces ExamRun) ---
  console.log('🏊 Seeding Exam Pools...');

  // Pool A: June 23 Morning (M1 Focused)
  await prisma.examPool.create({
    data: {
      eventId: juneEvent.id,
      name: 'Pool A (Morning Session)',
      examDate: new Date('2026-06-23'),
      examStartTime: '09:00',
      examEndTime: '12:00',
      status: 'OPEN',
      minCandidates: 25,
      maxCandidates: 28,
      preSeedModules: ['M1', 'M2'] // Suggesting these modules for this pool
    }
  });

  // Pool B: June 23 Afternoon
  await prisma.examPool.create({
    data: {
      eventId: juneEvent.id,
      name: 'Pool B (Afternoon Session)',
      examDate: new Date('2026-06-23'),
      examStartTime: '13:00',
      examEndTime: '16:00',
      status: 'OPEN',
      minCandidates: 25,
      maxCandidates: 28,
      preSeedModules: ['M7', 'M10']
    }
  });

  console.log('✅ Seed complete! Admin: floowdis@gmail.com / 123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
