import { PaymentStatus } from '@prisma/client'
import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function createWalletTransactionOnce(args: Parameters<typeof prisma.walletTransaction.create>[0]) {
  const { data } = args
  const existing = data.referenceType && data.referenceId
    ? await prisma.walletTransaction.findFirst({
        where: {
          walletId: data.walletId,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          description: data.description,
        },
      })
    : null

  if (existing) return existing
  return prisma.walletTransaction.create(args)
}

async function upsertSeedPayment(data: Parameters<typeof prisma.payment.create>[0]['data'] & { referenceCode: string }) {
  return prisma.payment.upsert({
    where: { referenceCode: data.referenceCode },
    update: {
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      status: data.status,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      approvedAt: data.approvedAt,
      notes: data.notes,
    },
    create: data,
  })
}

async function main() {
  console.log('🌱 Seeding full-time enrollments and transaction logs...')

  // 1. Get test users and their wallets
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'test' } },
    include: {
      wallet: true,
      studentProfile: { include: { pathwayRel: true } }
    }
  })

  if (users.length === 0) {
    console.error('❌ No test users found.')
    return
  }

  // Get a reference full-time programme
  const ftProgramme = await prisma.fullTimeProgramme.findFirst({
    include: { programmeYears: true }
  })

  if (!ftProgramme || ftProgramme.programmeYears.length === 0) {
    console.error('❌ No FullTimeProgramme found.')
    return
  }

  const programmeYear = ftProgramme.programmeYears[0]

  for (const user of users) {
    const pathwayCode = user.studentProfile?.pathwayRel?.code
    const wallet = user.wallet

    if (!wallet) continue

    console.log(`Processing ${user.email} (Pathway: ${pathwayCode})`)

    await upsertSeedPayment({
      userId: user.id,
      amount: 150,
      currency: 'EUR',
      paymentMethod: 'SEED',
      status: PaymentStatus.APPROVED,
      referenceCode: `SEED-REG-${user.id}`,
      referenceType: 'REGISTRATION',
      referenceId: user.studentProfile?.id || user.id,
      approvedAt: new Date('2026-01-10'),
      notes: 'Seeded registration payment for finance overview testing',
    })

    // A. Full-Time Enrollment Records
    if (pathwayCode?.startsWith('FULL_TIME') || pathwayCode?.startsWith('MILITARY')) {
      const ftEnrollment = await prisma.fullTimeEnrollment.upsert({
        where: { studentId_programmeId: { studentId: user.id, programmeId: ftProgramme.id } },
        update: {},
        create: {
          studentId: user.id,
          programmeId: ftProgramme.id,
          programmeYearId: programmeYear.id,
          status: 'PENDING_CONFIRMATION', // Not released yet
          academicYear: '2026/2027',
          currentYearNumber: 1
        }
      })

      await upsertSeedPayment({
        userId: user.id,
        amount: 1500,
        currency: 'EUR',
        paymentMethod: 'SEED',
        status: PaymentStatus.APPROVED,
        referenceCode: `SEED-COURSE-${ftEnrollment.id}`,
        referenceType: 'COURSE',
        referenceId: ftEnrollment.id,
        approvedAt: new Date('2026-02-01'),
        notes: `Seeded course payment for ${ftProgramme.name}`,
      })

      // Create a logical transaction for seat confirmation
      await createWalletTransactionOnce({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: 1500,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance, // Not reflecting deduction in balance
          availableBefore: wallet.availableBalance,
          availableAfter: wallet.availableBalance,
          description: `Seat Confirmation - ${ftProgramme.name}`,
          referenceType: 'FULL_TIME_ENROLLMENT',
          referenceId: ftEnrollment.id,
          metadata: { note: 'Historical audit record (Balance not deducted)', seeded: true }
        }
      })

      // Create a milestone
      const existingMilestone = await prisma.paymentMilestone.findFirst({
        where: {
          enrollmentId: ftEnrollment.id,
          yearNumber: 1,
          milestoneType: 'SEAT_CONFIRMATION',
        },
      })

      if (!existingMilestone) {
        await prisma.paymentMilestone.create({
          data: {
            enrollmentId: ftEnrollment.id,
            yearNumber: 1,
            milestoneType: 'SEAT_CONFIRMATION',
            dueDate: new Date('2026-06-01'),
            percentOfYearFee: 0,
            amountDue: 1500,
            status: 'DUE' // Not released
          }
        })
      }
    }

    // B. Transaction Records for other pathways (Modular, Exam-Only)
    if (pathwayCode === 'MODULAR' || pathwayCode === 'EXAM_ONLY') {
      const amount = pathwayCode === 'MODULAR' ? 1400 : 520
      const desc = pathwayCode === 'MODULAR' ? 'Module Enrollment Fee (Pending)' : 'Exam Booking Fee (Pending)'
      const referencedBooking = await prisma.examBooking.findFirst({
        where: {
          userId: user.id,
          deletedAt: null,
          migrationRef: { startsWith: 'TEST_ACCOUNT_BOOKING_SEED:' },
        },
        orderBy: { createdAt: 'desc' },
      })
      const referencedEnrollment = await prisma.enrollment.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
      const referenceType = pathwayCode === 'EXAM_ONLY' ? 'EXAM_BOOKING' : 'MODULAR_ENROLLMENT'
      const referenceId = pathwayCode === 'EXAM_ONLY'
        ? referencedBooking?.id
        : referencedEnrollment?.id

      if (!referenceId) {
        console.warn(`Skipping pathway transaction for ${user.email}; no ${referenceType} reference exists.`)
        continue
      }

      await upsertSeedPayment({
        userId: user.id,
        amount,
        currency: 'EUR',
        paymentMethod: 'SEED',
        status: PaymentStatus.APPROVED,
        referenceCode: `SEED-${pathwayCode}-${referenceId}`,
        referenceType: pathwayCode === 'EXAM_ONLY' ? 'EXAM' : 'COURSE',
        referenceId,
        approvedAt: new Date('2026-03-01'),
        notes: `Seeded ${pathwayCode === 'EXAM_ONLY' ? 'exam booking' : 'modular course'} payment`,
      })
      
      await createWalletTransactionOnce({
        data: {
          walletId: wallet.id,
          type: 'RESERVE',
          amount: amount,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance, // Not reflecting deduction
          availableBefore: wallet.availableBalance,
          availableAfter: wallet.availableBalance,
          description: desc,
          referenceType,
          referenceId,
          metadata: { 
            note: 'Audit log only',
            pathway: pathwayCode,
            seeded: true
          }
        }
      })
    }
  }

  console.log('✨ Transaction records seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
