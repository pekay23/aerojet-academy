import prisma from '@/lib/prisma/client'
import { generateNextStudentId } from './id-generator'
import { ensureWalletExists } from '@/lib/wallet/balance'
import { sendEmail, promotionToStudentEmail } from '@/lib/email'
import type { PromotionResult } from './types'

export async function promoteToStudent(userId: string): Promise<PromotionResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, studentProfile: true },
    })

    if (!user) return { success: false, error: 'User not found' }
    if (user.role === 'STUDENT' && user.studentProfile) {
      return { success: true, studentId: user.studentProfile.studentId }
    }

    const studentId = await generateNextStudentId()

    await prisma.$transaction(async (tx) => {
      // Create student profile
      await tx.studentProfile.create({
        data: {
          userId,
          studentId,
          enrollmentDate: new Date(),
          enrollmentType: 'MODULAR', // Defaulting
        },
      })

      // Update user role
      await tx.user.update({
        where: { id: userId },
        data: { role: 'STUDENT' },
      })

      // Ensure wallet exists
      await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0, reservedBalance: 0, currency: 'EUR' },
      })
    })

    // Send notification email
    const name = user.profile?.firstName || 'Student'
    sendEmail({
      to: user.academyEmail || user.email,
      subject: 'Welcome to Aerojet Academy - Student Account Created',
      html: promotionToStudentEmail(name, studentId, user.academyEmail || user.email),
    }).catch(() => {})

    return { success: true, studentId }
  } catch (err: any) {
    console.error('[PROMOTION ERROR]', err)
    return { success: false, error: err.message }
  }
}
