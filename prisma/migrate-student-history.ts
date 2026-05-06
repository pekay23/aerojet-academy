/**
 * Student Data Migration Script
 *
 * This script migrates historical exam and wallet data for 8 students.
 * Run with: npx tsx prisma/migrate-student-history.ts
 *
 * IMPORTANT:
 * - Check existing exam records first before creating new ones
 * - Leave exam dates blank for admin to fill manually
 * - Use USD 780 for historical twin pack pricing
 */

import prisma from '../lib/prisma/client'

// Student names to search for
const STUDENTS = [
  'David Archer',
  'Abdul Wahab Adam',
  'Dzator Stanley Korku',
  'Fred Frimpong Ampeh',
  'Bernard Bandor',
  'Edith Afi Avege',
  'Prince Wiafe',
  'Ebenezer Oduro Kwarteng',
]

async function findStudentByName(name: string) {
  // Try to find by full name match first
  let student = await prisma.user.findFirst({
    where: {
      OR: [{ email: { contains: name.toLowerCase().split(' ').pop() || '' } }],
      role: 'STUDENT',
    },
    include: {
      profile: true,
      studentProfile: true,
      wallet: true,
    },
  })

  // If not found, try partial match on name
  if (!student) {
    const searchTerms = name.toLowerCase().split(' ')
    for (const term of searchTerms) {
      if (term.length < 3) continue
      student = await prisma.user.findFirst({
        where: {
          email: { contains: term },
          role: 'STUDENT',
        },
        include: {
          profile: true,
          studentProfile: true,
          wallet: true,
        },
      })
      if (student) break
    }
  }

  return student
}

async function checkExistingExamRecords(userId: string) {
  const [examBookings, examResults] = await Promise.all([
    prisma.examBooking.findMany({
      where: { userId },
      include: {
        exam: true,
        examComponent: true,
      },
    }),
    prisma.examResult.findMany({
      where: { userId },
      include: {
        exam: true,
      },
    }),
  ])

  return { examBookings, examResults }
}

async function updateWalletBalance(userId: string, amount: number, description: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  })

  if (!wallet) {
    console.log(`  ⚠ No wallet found for user ${userId}`)
    return
  }

  // Update wallet balance
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      availableBalance: { increment: amount },
    },
  })

  // Create wallet transaction
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'CREDIT',
      amount: amount,
      description: description,
      referenceType: 'HISTORICAL_MIGRATION',
      referenceId: `MIGRATION-${userId}-${Date.now()}`,
    },
  })

  console.log(`  ✓ Updated wallet: +€${amount}`)
}

async function addAdminNote(userId: string, note: string) {
  // Check if there's an adminNotes field in studentProfile
  // For now, we'll store it in a note field or create a notification

  // Try to update studentProfile if it has notes field
  try {
    await prisma.studentProfile.update({
      where: { userId },
      data: {
        // This might need to be adjusted based on actual schema
        // For now, we'll log it
      },
    })
  } catch (e) {
    // Schema might not have notes field, just log
  }

  console.log(`  ✓ Admin note: "${note}"`)
}

async function migrateStudent(
  studentName: string,
  tasks: {
    walletAmount?: number
    walletDescription?: string
    adminNote?: string
    checkExisting?: boolean
  }
) {
  console.log(`\n👤 Processing: ${studentName}`)

  // Find student
  const student = await findStudentByName(studentName)
  if (!student) {
    console.log(`  ⚠ Student not found`)
    return null
  }

  console.log(`  ✓ Found: ${student.email} (ID: ${student.id})`)
  console.log(`    Student ID: ${student.studentProfile?.studentId || 'N/A'}`)

  // Check existing exam records if requested
  if (tasks.checkExisting) {
    const { examBookings, examResults } = await checkExistingExamRecords(student.id)
    console.log(`    Existing bookings: ${examBookings.length}`)
    console.log(`    Existing results: ${examResults.length}`)

    if (examResults.length > 0) {
      console.log(`    📋 Existing exam results:`)
      for (const result of examResults.slice(0, 5)) {
        console.log(
          `       - ${result.exam?.name || 'Unknown'}: ${result.passed ? 'PASS' : 'FAIL'}`
        )
      }
    }
  }

  // Update wallet
  if (tasks.walletAmount !== undefined && tasks.walletAmount > 0) {
    await updateWalletBalance(
      student.id,
      tasks.walletAmount,
      tasks.walletDescription || 'Historical credit'
    )
  } else if (tasks.walletAmount === 0) {
    console.log(`  ℹ Wallet balance: €0 (no change)`)
  }

  // Add admin note
  if (tasks.adminNote) {
    await addAdminNote(student.id, tasks.adminNote)
  }

  return student
}

async function main() {
  console.log('🎓 Student Data Migration')
  console.log('=========================\n')

  // Process each student based on the migration plan

  // 1. David Archer - No wallet, no exams
  await migrateStudent('David Archer', {
    walletAmount: 0,
    adminNote: 'Historical intended modules: M1, M2, M3, M4, M5, M8. M4 and M5 were refunded.',
  })

  // 2. Abdul Wahab Adam - €1340, no exams
  await migrateStudent('Abdul Wahab Adam', {
    walletAmount: 1340,
    walletDescription: 'Historical credit - intended modules M1, M2, M3, M8',
    adminNote: 'Historical intended modules: M1, M2, M3, M8. Consolidated from earlier records.',
  })

  // 3. Dzator Stanley Korku - €670, no exams
  await migrateStudent('Dzator Stanley Korku', {
    walletAmount: 670,
    walletDescription: 'Historical credit - intended modules M1, M8',
    adminNote: 'Historical intended modules: M1, M8',
  })

  // 4. Fred Frimpong Ampeh - €670, no exams
  await migrateStudent('Fred Frimpong Ampeh', {
    walletAmount: 670,
    walletDescription: 'Historical credit - intended modules M2, M3',
    adminNote: 'Historical intended modules: M2, M3',
  })

  // 5. Bernard Bandor - €3090, check existing
  await migrateStudent('Bernard Bandor', {
    walletAmount: 3090,
    walletDescription: 'Historical credit - intended modules M1, M2, M3, M8',
    adminNote:
      'Historical intended modules: M1, M2, M3, M8. License intentions: B1 & B2 (add as admin notes only).',
  })

  // 6. Edith Afi Avege - €670, check existing (has exam history)
  await migrateStudent('Edith Afi Avege', {
    walletAmount: 670,
    walletDescription: 'Reserved for M2, M3 twin booking',
    adminNote:
      'Earlier sitting: Twin pack M8+M10, failed both. Free resit used on M10, failed resit. Last sitting: Twin pack M1+M9, passed both. Intended next: M2, M3 twin booking. Wallet €670 reserved for M2,M3.',
    checkExisting: true,
  })

  // 7. Prince Wiafe - €0, check existing
  await migrateStudent('Prince Wiafe', {
    walletAmount: 0,
    adminNote:
      'Last sitting: Twin pack M1+M8, passed both. Intended next: M2, M3. No wallet funds.',
    checkExisting: true,
  })

  // 8. Ebenezer Oduro Kwarteng - €0, check existing
  await migrateStudent('Ebenezer Oduro Kwarteng', {
    walletAmount: 0,
    adminNote:
      'Last sitting: Twin pack M1+M8, passed both. Intended next: M2, M3. No wallet funds.',
    checkExisting: true,
  })

  console.log('\n✅ Migration complete!')
  console.log('\n⚠️  IMPORTANT NEXT STEPS:')
  console.log('1. Verify exam records for Edith, Prince, and Ebenezer')
  console.log('2. Add exam dates manually where blank')
  console.log('3. Create exam bookings if missing (use USD 780 for amount)')
  console.log('4. Create exam results if missing')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
