import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') {
    return apiError('Unauthorized', 401)
  }

  const body = await req.json()
  const { amount: amountStr, studentId, proofUrl, filename, fileType, fileSize } = body

  if (!amountStr || !studentId || !proofUrl) {
    return apiError('Missing required fields')
  }

  const amount = Number(amountStr)

  // Get student's wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  })

  if (!wallet) {
    return apiError('Wallet not found')
  }

  // Generate unique reference code
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  const referenceCode = `PAY-${studentId}-${timestamp}-${random}`

  await prisma.$transaction(async (tx) => {
    // 1. Create Payment record
    const payment = await tx.payment.create({
      data: {
        userId: session.user.id,
        amount,
        currency: 'GHS', // Hardcoded as per top-up page info
        status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        referenceCode,
        proofUrl,
        referenceType: 'WALLET_TOPUP',
      },
    })

    // 2. Create FileUpload record for tracking
    await tx.fileUpload.create({
      data: {
        userId: session.user.id,
        filename: filename || `proof-${referenceCode}`,
        originalName: filename || 'Payment Proof',
        mimeType: fileType || 'application/octet-stream',
        size: fileSize || 0,
        url: proofUrl,
        fileType: 'PAYMENT_PROOF',
        referenceType: 'PAYMENT',
        referenceId: payment.id,
      },
    })
  })

  return apiSuccess({ message: 'Upload successful' })
})
