import prisma from '../lib/prisma/client'

// Student email to migration info mapping
const STUDENTS = [
  { email: 'd.archer@aerojet-academy.com', name: 'David Archer', expectedWallet: 0 },
  { email: 'a.adam@aerojet-academy.com', name: 'Abdul Wahab Adam', expectedWallet: 1340 },
  { email: 'd.korku@aerojet-academy.com', name: 'Dzator Stanley Korku', expectedWallet: 670 },
  { email: 'f.ampeh@aerojet-academy.com', name: 'Fred Frimpong Ampeh', expectedWallet: 670 },
  { email: 'b.bandor@aerojet-academy.com', name: 'Bernard Bandor', expectedWallet: 3090 },
  { email: 'e.avege@aerojet-academy.com', name: 'Edith Afi Avege', expectedWallet: 670 },
  { email: 'p.wiafe@aerojet-academy.com', name: 'Prince Wiafe', expectedWallet: 0 },
  { email: 'e.kwarteng@aerojet-academy.com', name: 'Ebenezer Oduro Kwarteng', expectedWallet: 0 },
]

async function checkStudent(student: typeof STUDENTS[0]) {
  console.log(`\n👤 ${student.name} (${student.email})`)
  console.log(`   Expected wallet: €${student.expectedWallet}`)

  const user = await prisma.user.findUnique({
    where: { email: student.email },
    include: {
      wallet: true,
      studentProfile: true,
    },
  })

  if (!user) {
    console.log('   ❌ User not found')
    return
  }

  console.log(`   User ID: ${user.id}`)
  console.log(`   Student ID: ${user.studentProfile?.studentId || 'N/A'}`)
  console.log(`   Current wallet: €${user.wallet?.availableBalance || 0}`)

  // Check exam results
  const examResults = await prisma.examResult.findMany({
    where: { userId: user.id },
    include: { exam: true },
  })

  console.log(`   Exam results: ${examResults.length}`)
  if (examResults.length > 0) {
    for (const r of examResults) {
      console.log(`     - ${r.exam?.name || 'Unknown'}: ${r.passed ? 'PASS' : 'FAIL'} (score: ${r.score || 'N/A'})`)
    }
  }

  // Check exam bookings
  const examBookings = await prisma.examBooking.findMany({
    where: { userId: user.id },
    include: { exam: true, examComponent: true },
  })

  console.log(`   Exam bookings: ${examBookings.length}`)
  if (examBookings.length > 0) {
    for (const b of examBookings) {
      console.log(`     - ${b.exam?.name || 'Unknown'}: ${b.status} (date: ${b.examDate || 'TBD'})`)
    }
  }

  // Check wallet transactions
  if (user.wallet) {
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    console.log(`   Recent transactions: ${transactions.length}`)
    for (const t of transactions) {
      console.log(`     - ${t.type}: €${t.amount} - ${t.description}`)
    }
  }
}

async function main() {
  console.log('🎓 Checking Student Status')
  console.log('==========================\n')

  for (const student of STUDENTS) {
    await checkStudent(student)
  }

  console.log('\n✅ Status check complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
