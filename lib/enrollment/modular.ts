import prisma from '@/lib/prisma/client'

export async function enrollInModularPackage(packageId: string, userId: string) {
  const pkg = await prisma.modularPackage.findUnique({
    where: { id: packageId },
  })

  if (!pkg) throw new Error('Modular Package not found')
  if (!pkg.isActive) throw new Error('Package is not currently available for enrollment')

  // Prevent duplicate
  const existing = await prisma.modularEnrollment.findFirst({
    where: { studentId: userId, packageId: packageId },
  })

  if (existing) throw new Error('You are already enrolled in this package.')

  const amountToCharge = Number(pkg.price)

  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
    throw new Error('Insufficient wallet balance to purchase this modular package.')
  }

  const { chargeWallet } = await import('@/lib/wallet/operations')

  return prisma.$transaction(async (tx) => {
    // 1. Direct charge to wallet
    const chargeResult = await chargeWallet(
      tx,
      userId,
      amountToCharge,
      `Purchased Modular Package: ${pkg.name}`,
      pkg.id,
      'PACKAGE_ID'
    )

    // 2. Create the Enrollment
    const enrollment = await tx.modularEnrollment.create({
      data: {
        studentId: userId,
        packageId: packageId,
        status: 'ACTIVE',
        amountPaid: amountToCharge,
        // validFrom and validUntil could be set if durationMonths exists
      },
    })

    // 3. Role Upgrade
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (user?.role === 'APPLICANT') {
      await tx.user.update({
        where: { id: userId },
        data: { role: 'STUDENT' },
      })
      await tx.studentProfile.update({
        where: { userId },
        data: { enrollmentStatus: 'ENROLLED' },
      })
    }

    // 4. Auto-Exam Booking (User Feedback: Modular enrollment guarantees exam booking)
    // For each module in the package, create a placeholder MCQ booking (amountPaid: 0, included in pkg).
    // The student will then pick a specific date/event later without further charge.
    for (const moduleCode of pkg.modulesIncluded) {
      // Exam → ExamComponent → Course (not Exam → Course directly)
      const exam = await tx.exam.findFirst({
        where: { examComponent: { code: moduleCode, type: 'MCQ' } },
        orderBy: { examDate: 'asc' },
      })

      if (exam) {
        await tx.examBooking.create({
          data: {
            userId,
            examId: exam.id,
            bookingType: 'MODULAR',
            moduleCode,
            amountPaid: 0, // Included in package price
            status: 'APPROVED',
            examDate: exam.examDate,
          },
        })
      }
    }

    return enrollment
  })
}
