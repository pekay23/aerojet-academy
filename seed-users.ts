export {};
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await hash('123', 10); // Hash the password '123'

  // 1. Create Instructor: floowdis1@gmail.com
  const instructorEmail = 'floowdis1@gmail.com';
  const instructor = await prisma.user.upsert({
    where: { email: instructorEmail },
    update: {
      password: password,
      role: 'INSTRUCTOR',
      isActive: true,
    },
    create: {
      email: instructorEmail,
      name: 'Test Instructor',
      password: password,
      role: 'INSTRUCTOR',
      isActive: true,
    },
  });
  console.log(`✅ Created/Updated Instructor: ${instructor.email}`);

  // 2. Create Student: flopiski@gmail.com
  const studentEmail = 'flopiski@gmail.com';
  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      password: password,
      role: 'STUDENT',
      isActive: true,
    },
    create: {
      email: studentEmail,
      name: 'Test Student',
      password: password,
      role: 'STUDENT',
      isActive: true,
    },
  });

  // Ensure Student Profile exists
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      enrollmentStatus: 'ENROLLED', // Skip the "Applicant" phase for easier testing
      studentId: 'AATA-TEST-001'
    }
  });

  console.log(`✅ Created/Updated Student: ${studentUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
