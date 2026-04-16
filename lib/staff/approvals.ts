import prisma from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'
import { sendEmail, activationEmail, paymentApprovedEmail } from '@/lib/email'
import { generateAcademyEmail } from '@/lib/utils'
import { topUpWallet } from '@/lib/wallet/operations'
import type { ApprovalResult, ApprovalOptions } from './types'

export async function approveApplicant(
  userId: string,
  options: ApprovalOptions
): Promise<ApprovalResult> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } })
    if (!user) return { success: false, error: 'User not found' }
    if (user.status === 'ACTIVE') return { success: false, error: 'Already active' }

    const firstName = user.profile?.firstName || ''
    const lastName = user.profile?.lastName || ''
    const middleName = user.profile?.middleName || undefined
    const academyEmail = generateAcademyEmail(firstName, lastName, middleName)
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    const hashed = await bcrypt.hash(tempPassword, 12)

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        personalEmail: user.email, // Preserve personal email
        email: academyEmail, // Replace with academy email
        academyEmail,
        password: hashed,
        mustChangePassword: true,
      },
    })

    sendEmail({
      to: user.email,
      subject: 'Aerojet Academy - Account Activated',
      html: await activationEmail(firstName, academyEmail, tempPassword),
    }).catch(() => {})

    return { success: true, data: { academyEmail, tempPassword } }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function approvePayment(
  paymentId: string,
  options: ApprovalOptions
): Promise<ApprovalResult> {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: { include: { profile: true } } },
    })
    if (!payment) return { success: false, error: 'Payment not found' }
    if (payment.status !== 'PENDING') return { success: false, error: 'Payment is not pending' }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        approvedBy: options.approvedBy,
        approvedAt: new Date(),
        notes: options.notes,
      },
    })

    // If wallet top-up, credit the wallet
    if (payment.referenceType === 'WALLET_TOP_UP') {
      await prisma.$transaction(async (tx) => {
        await topUpWallet(
          tx,
          payment.userId,
          Number(payment.amount),
          `Top-up approved: ${payment.referenceCode}`,
          payment.id,
          'PAYMENT_ID'
        )
      })
    }

    const name = payment.user.profile?.firstName || 'User'
    sendEmail({
      to: payment.user.academyEmail || payment.user.email,
      subject: 'Payment Approved',
      html: await paymentApprovedEmail(name, `€${payment.amount}`, payment.referenceCode || ''),
    }).catch(() => {})

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
