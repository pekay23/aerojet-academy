import prisma from './lib/prisma/client'

async function verifyStudentHistory(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      studentProfile: true,
      examBookings: {
        include: { exam: { include: { examComponent: { include: { course: true } } } } },
      },
      examResults: {
        include: { exam: { include: { examComponent: { include: { course: true } } } } },
      },
    },
  })

  if (!user) {
    console.warn(`User ${email} NOT found in database.`)
    return
  }

  const fullName = `${user.profile?.firstName} ${user.profile?.lastName}`
  console.log(`\n--- Verification for: ${fullName} (${user.email}) ---`)
  console.log(`Enrollment Type: ${user.studentProfile?.enrollmentType}`)

  const bookingsWithResult = user.examBookings.filter((b) => b.result)
  console.log(`Bookings with results: ${bookingsWithResult.length}`)
  bookingsWithResult.forEach((b) => {
    console.log(`- ${b.moduleCode || '?'}: ${b.result} (Date: ${b.examDate || 'TBD'})`)
  })

  const formalResults = user.examResults
  console.log(`Formal results: ${formalResults.length}`)
  formalResults.forEach((r) => {
    console.log(
      `- ${r.exam.examComponent?.course?.code || '?'}: ${r.passed ? 'PASS' : 'FAIL'} (${Number(r.percentage)}%)`
    )
  })

  // Check unification logic
  const historicalResults = bookingsWithResult.filter((b) => {
    const bCode = b.moduleCode || b.exam?.examComponent?.course?.code
    const bDate = (b.examDate || b.bookedAt).getTime()
    return !formalResults.some(
      (f) => f.exam.examComponent?.course?.code === bCode && f.exam.examDate?.getTime() === bDate
    )
  })

  console.log(`Unified Historical records: ${historicalResults.length}`)
}

async function main() {
  await verifyStudentHistory('e.kwarteng@aerojet-academy.com')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
