import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { amount, currency: paymentCurrency, eurEquivalent, studentId, proofUrl, filename, fileType, fileSize } = await req.json()
    const submittedCurrency = paymentCurrency || 'GHS'

    if (!amount || !proofUrl) {
      return NextResponse.json({ error: 'Amount and payment proof are required.' }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount provided.' }, { status: 400 })
    }

    // Generate a unique reference code
    const referenceCode = `W-TOPUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const eurAmt = eurEquivalent ? parseFloat(eurEquivalent) : parsedAmount
    const rate = eurEquivalent ? (parsedAmount / parseFloat(eurEquivalent)) : 1

    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: eurAmt,
        currency: 'EUR',
        paymentCurrency: submittedCurrency,
        originalAmount: parsedAmount,
        exchangeRate: rate,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        proofUrl,
        proofUploadedAt: new Date(),
        referenceCode,
        referenceType: 'WALLET_TOPUP',
        referenceId: studentId,
        notes: `Student uploaded proof for Wallet Top-up. Original: ${submittedCurrency} ${parsedAmount}. File: ${filename || 'Unknown'}`,
      },
    })

    // Optionally record FileUpload if needed for the system
    if (filename && proofUrl) {
      await prisma.fileUpload.create({
        data: {
          userId,
          url: proofUrl,
          filename: filename || 'unknown',
          originalName: filename || 'unknown',
          size: fileSize ? parseInt(fileSize) : 0,
          mimeType: fileType || 'application/octet-stream',
          fileType: 'PAYMENT_PROOF',
        },
      })
    }

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'payments',
      entityId: payment.id,
      userId,
      description: `Student submitted a wallet top-up request for ${submittedCurrency} ${parsedAmount}`,
    })

    return NextResponse.json({ success: true, paymentId: payment.id }, { status: 201 })
  } catch (error: any) {
    console.error('Wallet proof upload error:', error)
    return NextResponse.json({ error: 'Failed to submit payment proof.' }, { status: 500 })
  }
}
