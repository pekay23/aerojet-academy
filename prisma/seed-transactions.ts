import { prismaUnfiltered as prisma } from '../lib/prisma/client'

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

      // Create a logical transaction for seat confirmation
      await prisma.walletTransaction.create({
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
          metadata: { note: 'Historical audit record (Balance not deducted)' }
        }
      })

      // Create a milestone
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

    // B. Transaction Records for other pathways (Modular, Exam-Only)
    if (pathwayCode === 'MODULAR' || pathwayCode === 'EXAM_ONLY') {
      const amount = pathwayCode === 'MODULAR' ? 1400 : 520
      const desc = pathwayCode === 'MODULAR' ? 'Module Enrollment Fee (Pending)' : 'Exam Booking Fee (Pending)'
      
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'RESERVE',
          amount: amount,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance, // Not reflecting deduction
          availableBefore: wallet.availableBalance,
          availableAfter: wallet.availableBalance,
          description: desc,
          metadata: { 
            note: 'Audit log only',
            pathway: pathwayCode
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
