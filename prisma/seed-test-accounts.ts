import { prismaUnfiltered as prisma } from '../lib/prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding 10 test student accounts...')

  const password = await bcrypt.hash('123456', 12)

  // Get some reference data
  const pathways = await prisma.studyPathwayModel.findMany()
  const pathwaysMap = Object.fromEntries(pathways.map((p) => [p.code, p.id]))

  const courses = await prisma.course.findMany({ take: 5 })
  const examComponents = await prisma.examComponent.findMany({ take: 10 })

  const studentsData = [
    { email: 'test1@test.com', firstName: 'Test', lastName: 'One', pathway: 'FULL_TIME_4Y', status: 'ENROLLED' },
    { email: 'test2@test.com', firstName: 'Test', lastName: 'Two', pathway: 'FULL_TIME_4Y', status: 'ENROLLED' },
    { email: 'test3@test.com', firstName: 'Test', lastName: 'Three', pathway: 'FULL_TIME_2Y', status: 'ENROLLED' },
    { email: 'test4@test.com', firstName: 'Test', lastName: 'Four', pathway: 'MILITARY_1Y', status: 'ENROLLED' },
    { email: 'test5@test.com', firstName: 'Test', lastName: 'Five', pathway: 'MODULAR', status: 'ENROLLED' },
    { email: 'test6@test.com', firstName: 'Test', lastName: 'Six', pathway: 'EXAM_ONLY', status: 'ENROLLED' },
    { email: 'test7@test.com', firstName: 'Test', lastName: 'Seven', pathway: 'FULL_TIME_4Y', status: 'GRADUATED' },
    { email: 'test8@test.com', firstName: 'Test', lastName: 'Eight', pathway: 'FULL_TIME_4Y', status: 'SUSPENDED' },
    { email: 'test9@test.com', firstName: 'Test', lastName: 'Nine', pathway: 'MODULAR', status: 'ENROLLED' },
    { email: 'test10@test.com', firstName: 'Test', lastName: 'Ten', pathway: 'EXAM_ONLY', status: 'ENROLLED' },
  ]

  for (let i = 0; i < studentsData.length; i++) {
    const data = studentsData[i]
    const studentId = `TEST-${(i + 1).toString().padStart(4, '0')}`

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        password,
        role: 'STUDENT',
        status: 'ACTIVE',
        emailVerified: new Date(),
        mustChangePassword: false,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            nationality: 'Ghanaian',
            country: 'Ghana',
            city: 'Accra',
          },
        },
        studentProfile: {
          create: {
            studentId,
            enrollmentStatus: data.status as any,
            pathwayId: pathwaysMap[data.pathway],
          },
        },
        wallet: {
          create: {
            balance: 2500,
            availableBalance: 2500,
            currency: 'EUR',
          },
        },
      },
    })

    console.log(`✅ Created ${data.email} (${studentId})`)

    // Add some enrollments for some students
    if (i < 5 && courses.length > 0) {
      await prisma.enrollment.createMany({
        data: courses.slice(0, 3).map((c) => ({
          userId: user.id,
          courseId: c.id,
          status: 'ENROLLED',
        })),
        skipDuplicates: true,
      })
    }

    // Add some exam results for graduated or active students
    if ((data.status === 'GRADUATED' || i < 3) && examComponents.length > 0) {
       for (const ec of examComponents.slice(0, 3)) {
          await prisma.examResult.create({
            data: {
              userId: user.id,
              moduleCode: ec.code,
              score: 85,
              percentage: 85,
              passed: true,
              attemptType: 'FIRST_ATTEMPT',
            }
          })
       }
    }
  }

  console.log('✨ Test accounts seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
