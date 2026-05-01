import { prismaUnfiltered as prisma } from '../lib/prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🚀 Seeding advanced testing scenarios...')

  const password = await bcrypt.hash('123456', 12)

  // 1. Create a dedicated Staff User
  const staff = await prisma.user.upsert({
    where: { email: 'coordinator@test.com' },
    update: {},
    create: {
      email: 'coordinator@test.com',
      password,
      role: 'STAFF',
      status: 'ACTIVE',
      profile: {
        create: { firstName: 'Alice', lastName: 'Coordinator' }
      },
      staffProfile: {
        create: { employeeId: 'ST-002', department: 'Academic', position: 'Coordinator' }
      }
    }
  })
  console.log('✅ Staff User created.')

  // 2. Create an Examiner
  const examiner = await prisma.user.upsert({
    where: { email: 'examiner1@test.com' },
    update: {},
    create: {
      email: 'examiner1@test.com',
      password,
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
      profile: {
        create: { firstName: 'Robert', lastName: 'Exams' }
      },
      examinerProfile: {
        create: { 
          isActive: true,
          maxParallelSittings: 2
        }
      }
    }
  })
  
  const examinerRecord = await prisma.examiner.findFirst({ where: { userId: examiner.id } })
  console.log('✅ Examiner created.')

  // 3. Exam Sittings & Assignments
  const bookings = await prisma.examBooking.findMany({ 
    where: { examComponentId: { not: null } },
    take: 5 
  })
  if (bookings.length > 0) {
    const event = await prisma.examEvent.findFirst()
    if (event) {
      // Check if sitting already exists for this hall/time
      let sitting = await prisma.examSitting.findFirst({
        where: { venue: 'Main Exam Hall', startTime: new Date('2026-06-15T09:00:00Z') }
      })

      if (!sitting) {
        sitting = await prisma.examSitting.create({
          data: {
            eventId: event.id,
            examComponentId: bookings[0].examComponentId!,
            dayNumber: 1,
            sessionType: 'MORNING',
            startTime: new Date('2026-06-15T09:00:00Z'),
            endTime: new Date('2026-06-15T11:00:00Z'),
            capacity: 28,
            status: 'SCHEDULED',
            venue: 'Main Exam Hall',
            examinerId: examinerRecord?.id
          }
        })
      }

      for (const booking of bookings) {
        await prisma.examSittingAssignment.upsert({
          where: { bookingId_sittingId: { bookingId: booking.id, sittingId: sitting.id } },
          update: {},
          create: {
            sittingId: sitting.id,
            bookingId: booking.id,
            userId: booking.userId,
            status: 'CONFIRMED'
          }
        })
      }
      console.log(`✅ Exam Sitting created/verified and ${bookings.length} students assigned.`)
    }
  }

  // 4. Invoices
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } })
  if (student) {
    const invNum = 'INV-REG-TEST-001'
    await prisma.invoice.upsert({
      where: { invoiceNumber: invNum },
      update: {},
      create: {
        userId: student.id,
        invoiceNumber: invNum,
        amount: 350.00,
        status: 'UNPAID',
        items: [
          { description: 'Registration Fee', amount: 350.00 }
        ],
        dueDate: new Date('2026-07-01')
      }
    })
    console.log('✅ Sample Invoice created.')
  }

  // 5. Exam Bundles
  const modularStudent = await prisma.user.findFirst({
    where: { studentProfile: { pathwayRel: { code: 'MODULAR' } } }
  })
  if (modularStudent) {
    await prisma.examBundle.upsert({
      where: { id: `bundle-${modularStudent.id}` },
      update: {},
      create: {
        id: `bundle-${modularStudent.id}`,
        userId: modularStudent.id,
        bundleType: 'FOUR_PACK',
        totalSeats: 4,
        usedSeats: 1,
        amountPaid: 1100.00,
        validUntil: new Date('2027-05-01'),
        status: 'ACTIVE'
      }
    })
    console.log('✅ Exam Bundle created for Modular Student.')
  }

  // 6. Referrals
  const studentA = await prisma.user.findFirst({ where: { email: 'test1@test.com' } })
  const studentB = await prisma.user.findFirst({ where: { email: 'test2@test.com' } })
  if (studentA && studentB) {
    await prisma.referral.upsert({
      where: { referrerId_refereeId: { referrerId: studentA.id, refereeId: studentB.id } },
      update: {},
      create: {
        referrerId: studentA.id,
        refereeId: studentB.id,
        status: 'QUALIFIED',
        qualifiedAt: new Date()
      }
    })
    console.log('✅ Referral link created.')
  }

  // 7. OJT Periods
  const ftEnrollment = await prisma.fullTimeEnrollment.findFirst()
  if (ftEnrollment) {
    await prisma.ojtPeriod.upsert({
      where: { id: `ojt-${ftEnrollment.id}` },
      update: {},
      create: {
        id: `ojt-${ftEnrollment.id}`,
        enrollmentId: ftEnrollment.id,
        companyName: 'AeroJet Maintenance Ltd',
        companyAddress: 'Hangar 4, Airport West',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-01'),
        status: 'PENDING',
        hoursCompleted: 320,
        hoursRequired: 2000,
        notes: 'Initial engine shop rotation'
      }
    })
    console.log('✅ OJT Period created.')
  }

  // 8. Messaging
  if (student && staff) {
    await prisma.message.create({
      data: {
        senderId: student.id,
        recipientId: staff.id,
        subject: 'Inquiry about M5 Schedule',
        body: 'Hello, I would like to know if there are any changes to the M5 revision schedule next week?',
        isRead: false
      }
    })
    console.log('✅ Message thread initialized.')
  }

  // 9. Payment Pending Proof
  if (student) {
    await prisma.payment.create({
      data: {
        userId: student.id,
        amount: 1400.00,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        proofUrl: 'https://example.com/proof.pdf',
        proofUploadedAt: new Date(),
        referenceCode: `DEP-${Date.now()}`
      }
    })
    console.log('✅ Pending Payment with proof created.')
  }

  console.log('✨ Advanced scenarios seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
