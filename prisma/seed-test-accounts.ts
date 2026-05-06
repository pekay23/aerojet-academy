import { BookingDemandStatus, PaymentStatus } from '@prisma/client'
import { prismaUnfiltered as prisma } from '../lib/prisma/client'
import bcrypt from 'bcryptjs'

const bookingScenarios = [
  { demandStatus: BookingDemandStatus.DEMAND_CAPTURED, status: PaymentStatus.PENDING, daysFromNow: 45 },
  { demandStatus: BookingDemandStatus.POOLED, status: PaymentStatus.APPROVED, daysFromNow: 35 },
  { demandStatus: BookingDemandStatus.SCHEDULED, status: PaymentStatus.APPROVED, daysFromNow: 14 },
  { demandStatus: BookingDemandStatus.EXECUTED, status: PaymentStatus.APPROVED, daysFromNow: -21, score: 82, result: 'pass' },
]

function addUtcDays(base: Date, days: number) {
  const date = new Date(base)
  date.setUTCDate(date.getUTCDate() + days)
  return date
}

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

    // Add representative exam bookings for portal and finance testing.
    if (examComponents.length > 0) {
      const baseDate = new Date(Date.UTC(2026, 4, 6, 9, 0, 0))
      const componentsForBookings = examComponents.slice(0, Math.min(4, examComponents.length))

      for (let bookingIndex = 0; bookingIndex < componentsForBookings.length; bookingIndex++) {
        const ec = componentsForBookings[bookingIndex]
        const scenario = bookingScenarios[(bookingIndex + i) % bookingScenarios.length]
        const migrationRef = `TEST_ACCOUNT_BOOKING_SEED:${studentId}:${ec.code}:${scenario.demandStatus}`
        const existingBooking = await prisma.examBooking.findFirst({
          where: { userId: user.id, migrationRef },
        })

        if (existingBooking) continue

        const hasScheduledDate =
          scenario.demandStatus === BookingDemandStatus.SCHEDULED ||
          scenario.demandStatus === BookingDemandStatus.EXECUTED
        const examDate = hasScheduledDate ? addUtcDays(baseDate, scenario.daysFromNow) : null

        await prisma.examBooking.create({
          data: {
            userId: user.id,
            examComponentId: ec.id,
            moduleCode: ec.code,
            amountPaid: 520,
            bookingType: 'INDIVIDUAL',
            demandStatus: scenario.demandStatus,
            status: scenario.status,
            bookedAt: addUtcDays(baseDate, -30 + bookingIndex),
            examDate,
            attemptType: bookingIndex === 3 ? 'RESIT_1' : 'FIRST',
            result: scenario.result,
            score: scenario.score,
            percentage: scenario.score,
            examCategory: 'OFFICIAL_EASA',
            migrationRef,
            sourceNotes: 'Seeded test account exam booking state',
            executedAt: scenario.demandStatus === BookingDemandStatus.EXECUTED ? examDate : null,
          },
        })
      }

      const migratedComponent = examComponents[componentsForBookings.length] || examComponents[0]
      const migratedRef = `TEST_ACCOUNT_BOOKING_SEED:${studentId}:${migratedComponent.code}:MIGRATED`
      const existingMigrated = await prisma.examBooking.findFirst({
        where: { userId: user.id, migrationRef: migratedRef },
      })

      if (!existingMigrated) {
        const migratedDate = addUtcDays(baseDate, -75)
        await prisma.examBooking.create({
          data: {
            userId: user.id,
            examComponentId: migratedComponent.id,
            moduleCode: migratedComponent.code,
            amountPaid: 0,
            bookingType: 'MANUAL',
            demandStatus: BookingDemandStatus.EXECUTED,
            status: PaymentStatus.APPROVED,
            bookedAt: addUtcDays(baseDate, -90),
            examDate: migratedDate,
            attemptType: 'FIRST',
            result: 'MIGRATED',
            examCategory: 'OFFICIAL_EASA',
            migrationRef: migratedRef,
            sourceNotes: 'Seeded migrated booking metadata example',
            executedAt: migratedDate,
          },
        })
      }
    }

    // Add some exam results for graduated or active students
    if ((data.status === 'GRADUATED' || i < 3) && examComponents.length > 0) {
       for (let examIndex = 0; examIndex < examComponents.slice(0, 3).length; examIndex++) {
          const ec = examComponents[examIndex]
          const migrationRef = `TEST_ACCOUNT_SEED:${studentId}:${ec.code}:FIRST`
          const existingResult = await prisma.examResult.findFirst({
            where: { userId: user.id, migrationRef },
          })

          if (existingResult) continue

          await prisma.examResult.create({
            data: {
              userId: user.id,
              moduleCode: ec.code,
              score: 85,
              maxScore: 100,
              percentage: 85,
              passed: true,
              grade: 'PASS',
              attemptType: 'FIRST',
              migrationRef,
              sourceNotes: 'Seeded test account exam history',
              examCategory: 'OFFICIAL_EASA',
              createdAt: new Date(Date.UTC(2026, examIndex, 15)),
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
