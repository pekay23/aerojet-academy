import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2026', 12)
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@aerojet-academy.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@aerojet-academy.com',
      academyEmail: 'admin@aerojet-academy.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          phone: '+233200000000',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
    },
  })
  console.log(`✅ Super Admin: ${admin.email}`)

  // 2. Create Staff user
  const staffPassword = await bcrypt.hash('Staff@2026', 12)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@aerojet-academy.com' },
    update: {},
    create: {
      email: 'staff@aerojet-academy.com',
      academyEmail: 'staff@aerojet-academy.com',
      password: staffPassword,
      role: 'STAFF',
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Staff',
          phone: '+233200000001',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
    },
  })
  console.log(`✅ Staff: ${staff.email}`)

  // 3. Create Instructor
  const instructorPassword = await bcrypt.hash('Instructor@2026', 12)
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@aerojet-academy.com' },
    update: {},
    create: {
      email: 'instructor@aerojet-academy.com',
      academyEmail: 'instructor@aerojet-academy.com',
      password: instructorPassword,
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Captain',
          lastName: 'Mensah',
          phone: '+233200000002',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
      instructorProfile: {
        create: {
          employeeId: 'EMP-001',
          specialization: 'B1 Mechanical',
          qualifications: 'EASA-GH-2024-001',
        },
      },
    },
  })
  console.log(`✅ Instructor: ${instructor.email}`)

  // 4. Create Demo Student
  const studentPassword = await bcrypt.hash('Student@2026', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@aerojet-academy.com' },
    update: {},
    create: {
      email: 'student@aerojet-academy.com',
      academyEmail: 'k.owusu@aerojet-academy.com',
      password: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',

      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Kwame',
          lastName: 'Owusu',
          phone: '+233200000003',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',

        },
      },
      studentProfile: {
        create: {
    
          studentId: 'AJA-2026-0001',
          enrollmentType: 'FULL_TIME',
          enrollmentDate: new Date(),
        },
      },
      wallet: {
        create: {
          balance: 1500,
          reservedBalance: 0,
          currency: 'EUR',
        },
      },
    },
  })
  console.log(`✅ Student: ${student.email} (ID: AJA-2026-0001)`)

  // 5. Create Demo Applicant
  const applicantPassword = await bcrypt.hash('Applicant@2026', 12)
  const applicant = await prisma.user.upsert({
    where: { email: 'applicant@example.com' },
    update: {},
    create: {
      email: 'applicant@example.com',
      password: applicantPassword,
      role: 'APPLICANT',
      status: 'PENDING',
      registrationCode: 'AERO-2026-DEMO01',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Ama',
          lastName: 'Adjei',
          phone: '+233200000004',
          nationality: 'Ghanaian',
          country: 'Ghana',


        },
      },
    },
  })
  console.log(`✅ Applicant: ${applicant.email}`)

  // 6. Seed Courses
  const courses = [
    { code: 'B1B2-4Y', name: '4-Year B1/B2 Licensed Aircraft Engineer', type: 'FOUR_YEAR', price: 24000, hours: 4800, description: 'Comprehensive 4-year EASA Part-66 B1 and B2 programme covering all required modules for dual licensing.' },
    { code: 'B1-2Y', name: '2-Year B1 Mechanical Programme', type: 'TWO_YEAR', price: 14000, hours: 2400, description: 'Focused 2-year programme for EASA Part-66 B1 mechanical aircraft maintenance licensing.' },
    { code: 'MIL-12M', name: 'Military/Industry Certification', type: 'MILITARY', price: 8500, hours: 1200, description: '12-month accelerated programme for military personnel and industry professionals seeking EASA certification.' },
    { code: 'MOD-FLEX', name: 'Modular Training Programme', type: 'MODULAR', price: 450, hours: null, description: 'Flexible per-module training. Pick individual modules to study at your own pace.' },
    { code: 'EXAM-ONLY', name: 'Exam Only (Per Sitting)', type: 'EXAM_ONLY', price: 300, hours: null, description: 'Register for EASA Part-66 examinations without attending training classes.' },
    { code: 'REV-MOD', name: 'Revision Support Classes', type: 'REVISION', price: 200, hours: null, description: 'Targeted revision classes for specific modules to prepare for examinations.' },
  ]

  for (const course of courses) {
    await prisma.course.upsert({
      where: { code: course.code },
      update: {},
      create: {
        code: course.code,
        name: course.name,
        category: course.type,
        duration: course.hours,
        price: course.price,
        description: course.description,
        currency: 'EUR',
        isActive: true
      },
    })
  }
  console.log(`✅ ${courses.length} Courses seeded`)

  // 7. Seed System Settings
  const settings = [
    { key: 'academy_name', value: 'Aerojet Aviation Training Academy', type: 'STRING', description: 'general' },
    { key: 'academy_email', value: 'info@aerojet-academy.com', type: 'STRING', description: 'general' },
    { key: 'academy_phone', value: '+233 30 123 4567', type: 'STRING', description: 'general' },
    { key: 'academy_address', value: 'Kotoka International Airport Area, Accra, Ghana', type: 'STRING', description: 'general' },
    { key: 'bank_name', value: 'Ecobank Ghana', type: 'STRING', description: 'bank' },
    { key: 'bank_account_name', value: 'Aerojet Aviation Training Academy Ltd', type: 'STRING', description: 'bank' },
    { key: 'bank_account_number', value: '0011223344556677', type: 'STRING', description: 'bank' },
    { key: 'bank_swift', value: 'EABORGHAC', type: 'STRING', description: 'bank' },
    { key: 'bank_branch', value: 'Airport City Branch', type: 'STRING', description: 'bank' },
    { key: 'registration_open', value: 'true', type: 'BOOLEAN', description: 'registration' },
    { key: 'exam_pool_fee', value: '300', type: 'NUMBER', description: 'exams' },
    { key: 'pool_min_candidates', value: '25', type: 'NUMBER', description: 'exams' },
    { key: 'pool_max_candidates', value: '28', type: 'NUMBER', description: 'exams' },
    { key: 'pool_deadline_days', value: '21', type: 'NUMBER', description: 'exams' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log(`✅ ${settings.length} Settings seeded`)

  // 8. Enroll demo student in course
  const fourYearCourse = await prisma.course.findUnique({ where: { code: 'B1B2-4Y' } })
  if (fourYearCourse) {
    await prisma.enrollment.upsert({
      where: { id: 'demo-enrollment-1' },
      update: {},
      create: {
        id: 'demo-enrollment-1',
        userId: student.id,
        courseId: fourYearCourse.id,
        status: 'ENROLLED',
        enrolledAt: new Date(),
      },
    })
    console.log(`✅ Demo enrollment created`)
  }

  console.log('\n🎉 Seed completed successfully!')
  console.log('\nDemo credentials:')
  console.log('  Super Admin: admin@aerojet-academy.com / Admin@2026')
  console.log('  Staff:       staff@aerojet-academy.com / Staff@2026')
  console.log('  Instructor:  instructor@aerojet-academy.com / Instructor@2026')
  console.log('  Student:     student@aerojet-academy.com / Student@2026')
  console.log('  Applicant:   applicant@example.com / Applicant@2026')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
