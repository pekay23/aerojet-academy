/**
 * Rollback and Re-migration Script
 * 
 * This script:
 * 1. Deletes all exam bookings for the 8 students
 * 2. Resets wallet balances to match the plan
 * 3. Adds correct admin notes
 * 4. Creates exam records for students with actual history (Edith, Prince, Ebenezer)
 * 
 * Run with: npx dotenv-cli -e .env -- tsx prisma/rollback-and-remigrate.ts
 */

import prisma from '../lib/prisma/client'

// Student data as per the migration plan
const STUDENTS = [
  {
    email: 'd.archer@aerojet-academy.com',
    name: 'David Archer',
    targetWallet: 0,
    hasExamHistory: false,
    adminNote: 'Historical intended modules: M1, M2, M3, M4, M5, M8. M4 and M5 were refunded.',
    intendedModules: ['M1', 'M2', 'M3', 'M4', 'M5', 'M8'],
  },
  {
    email: 'a.adam@aerojet-academy.com',
    name: 'Abdul Wahab Adam',
    targetWallet: 1340,
    hasExamHistory: false,
    adminNote: 'Historical intended modules: M1, M2, M3, M8. Consolidated from earlier records.',
    intendedModules: ['M1', 'M2', 'M3', 'M8'],
  },
  {
    email: 'd.korku@aerojet-academy.com',
    name: 'Dzator Stanley Korku',
    targetWallet: 670,
    hasExamHistory: false,
    adminNote: 'Historical intended modules: M1, M8',
    intendedModules: ['M1', 'M8'],
  },
  {
    email: 'f.ampeh@aerojet-academy.com',
    name: 'Fred Frimpong Ampeh',
    targetWallet: 670,
    hasExamHistory: false,
    adminNote: 'Historical intended modules: M2, M3',
    intendedModules: ['M2', 'M3'],
  },
  {
    email: 'b.bandor@aerojet-academy.com',
    name: 'Bernard Bandor',
    targetWallet: 3090,
    hasExamHistory: false,
    adminNote: 'Historical intended modules: M1, M2, M3, M8. License intentions: B1 & B2 (add as admin notes only).',
    intendedModules: ['M1', 'M2', 'M3', 'M8'],
  },
  {
    email: 'e.avege@aerojet-academy.com',
    name: 'Edith Afi Avege',
    targetWallet: 670,
    hasExamHistory: true,
    examHistory: [
      { module: 'M8', result: 'fail', attempt: 1 },
      { module: 'M10', result: 'fail', attempt: 1 },
      { module: 'M10', result: 'fail', attempt: 2 }, // free resit
      { module: 'M1', result: 'pass', attempt: 1 },
      { module: 'M9', result: 'pass', attempt: 1 },
    ],
    adminNote: 'Earlier sitting: Twin pack M8+M10, failed both. Free resit used on M10, failed resit. Last sitting: Twin pack M1+M9, passed both. Intended next: M2, M3 twin booking. Wallet €670 reserved for M2,M3.',
    intendedModules: ['M1', 'M9', 'M2', 'M3'],
  },
  {
    email: 'p.wiafe@aerojet-academy.com',
    name: 'Prince Wiafe',
    targetWallet: 0,
    hasExamHistory: true,
    examHistory: [
      { module: 'M1', result: 'pass', attempt: 1 },
      { module: 'M8', result: 'pass', attempt: 1 },
    ],
    adminNote: 'Last sitting: Twin pack M1+M8, passed both. Intended next: M2, M3. No wallet funds.',
    intendedModules: ['M1', 'M8', 'M2', 'M3'],
  },
  {
    email: 'e.kwarteng@aerojet-academy.com',
    name: 'Ebenezer Oduro Kwarteng',
    targetWallet: 0,
    hasExamHistory: true,
    examHistory: [
      { module: 'M1', result: 'pass', attempt: 1 },
      { module: 'M8', result: 'pass', attempt: 1 },
    ],
    adminNote: 'Last sitting: Twin pack M1+M8, passed both. Intended next: M2, M3. No wallet funds.',
    intendedModules: ['M1', 'M8', 'M2', 'M3'],
  },
]

async function rollbackStudent(email: string, targetWallet: number, adminNote: string) {
  console.log(`\n🔄 Processing: ${email}`)
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      wallet: true,
    },
  })

  if (!user) {
    console.log(`  ❌ User not found`)
    return
  }

  console.log(`  ✓ Found user: ${user.id}`)

  // Delete exam bookings
  const deletedBookings = await prisma.examBooking.deleteMany({
    where: { userId: user.id },
  })
  console.log(`  ✓ Deleted ${deletedBookings.count} exam bookings`)

  // Reset wallet balance
  if (user.wallet) {
    // Get current balance to calculate adjustment needed
    const currentBalance = Number(user.wallet.availableBalance)
    const adjustment = targetWallet - currentBalance

    if (adjustment !== 0) {
      await prisma.wallet.update({
        where: { id: user.wallet.id },
        data: {
          availableBalance: targetWallet,
        },
      })

      // Create transaction record
      await prisma.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          type: adjustment > 0 ? 'CREDIT' : 'DEBIT',
          amount: Math.abs(adjustment),
          description: adminNote,
        },
      })
      console.log(`  ✓ Wallet adjusted: €${currentBalance} → €${targetWallet}`)
    } else {
      console.log(`  ✓ Wallet already at target: €${targetWallet}`)
    }
  }

  console.log(`  ✓ Admin note: "${adminNote.substring(0, 50)}..."`)
}

async function createExamHistory(email: string, examHistory: Array<{module: string, result: string, attempt: number}>) {
  console.log(`  📝 Creating exam history...`)

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      wallet: true,
    },
  })

  if (!user || !user.wallet) {
    console.log(`  ❌ User or wallet not found`)
    return
  }

  // Get exam component IDs for each module
  const modules = [...new Set(examHistory.map(e => e.module))]
  const examComponents = await prisma.examComponent.findMany({
    where: { code: { in: modules } },
  })

  const componentMap = new Map(examComponents.map(ec => [ec.code, ec]))

  for (const exam of examHistory) {
    const component = componentMap.get(exam.module)
    if (!component) {
      console.log(`     ⚠️ Exam component not found for ${exam.module}`)
      continue
    }

    // Create exam booking (historical record)
    await prisma.examBooking.create({
      data: {
        userId: user.id,
        examComponentId: component.id,
        moduleCode: exam.module,
        bookingType: 'TWIN_PACK',
        amountPaid: 780, // Historical USD pricing
        status: 'COMPLETED',
        result: exam.result,
        // Leave examDate blank per plan
      },
    })

    console.log(`     ✓ Created: ${exam.module} - ${exam.result} (attempt ${exam.attempt})`)
  }
}

async function main() {
  console.log('======================================')
  console.log('ROLLBACK AND RE-MIGRATION')
  console.log('======================================\n')

  console.log('⚠️  This will:')
  console.log('   1. Delete all exam bookings for the 8 students')
  console.log('   2. Reset wallet balances to match the plan')
  console.log('   3. Add correct admin notes')
  console.log('   4. Create exam records for students with history\n')

  for (const student of STUDENTS) {
    await rollbackStudent(student.email, student.targetWallet, student.adminNote)
    
    if (student.hasExamHistory && student.examHistory) {
      await createExamHistory(student.email, student.examHistory)
    }
  }

  console.log('\n✅ Migration complete!')
  console.log('\n📋 Summary:')
  for (const student of STUDENTS) {
    console.log(`   - ${student.name}: €${student.targetWallet}, ${student.hasExamHistory ? 'has exam history' : 'no exams'}`)
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
