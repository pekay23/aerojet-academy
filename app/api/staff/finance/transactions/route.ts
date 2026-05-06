import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'

/**
 * GET /api/staff/finance/transactions
 *
 * Paginated wallet transactions endpoint for the finance transactions tab.
 */
export async function GET(req: NextRequest) {
  try {
    await requireStaff()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const query = searchParams.get('query') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    const skip = (page - 1) * limit

    // Build where filter
    const where = query
      ? {
          OR: [
            {
              wallet: {
                user: {
                  OR: [
                    { email: { contains: query, mode: 'insensitive' as const } },
                    { profile: { firstName: { contains: query, mode: 'insensitive' as const } } },
                    { profile: { lastName: { contains: query, mode: 'insensitive' as const } } },
                  ],
                },
              },
            },
            { referenceId: { contains: query, mode: 'insensitive' as const } },
            { referenceType: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : undefined

    // Build orderBy
    const orderBy: any = {}
    if (['createdAt', 'amount', 'type'].includes(sortBy)) {
      orderBy[sortBy] = sortDir
    } else {
      orderBy.createdAt = 'desc'
    }

    const [transactions, total] = await Promise.all([
      prismaUnfiltered.walletTransaction.findMany({
        where,
        orderBy,
        include: { wallet: { include: { user: { include: { profile: true } } } } },
        skip,
        take: limit,
      }),
      prismaUnfiltered.walletTransaction.count({ where }),
    ])

    const serialized = serializePrisma(transactions)
    const transactionIds = serialized.map((tx: any) => tx.id)

    const paymentIds = serialized
      .filter((tx: any) => tx.referenceType === 'PAYMENT_ID' && tx.referenceId)
      .map((tx: any) => tx.referenceId!)
    const examBookingReferenceIds = serialized
      .filter((tx: any) => tx.referenceType === 'EXAM_BOOKING' && tx.referenceId)
      .map((tx: any) => tx.referenceId!)
    const fullTimeEnrollmentIds = serialized
      .filter((tx: any) => tx.referenceType === 'FULL_TIME_ENROLLMENT' && tx.referenceId)
      .map((tx: any) => tx.referenceId!)

    // Fetch related data in parallel
    const [relatedPayments, relatedExamBookings, relatedFullTimeEnrollments, relatedModularEnrollments, relatedMilestones] =
      await Promise.all([
        paymentIds.length > 0
          ? prismaUnfiltered.payment.findMany({
              where: { id: { in: paymentIds } },
              select: { id: true, reconciled: true, paymentCurrency: true, originalAmount: true, status: true },
            })
          : Promise.resolve([]),
        transactionIds.length > 0 || examBookingReferenceIds.length > 0
          ? prismaUnfiltered.examBooking.findMany({
              where: {
                OR: [
                  { id: { in: examBookingReferenceIds } },
                  { walletTxnId: { in: transactionIds } },
                ],
              },
              select: { id: true, walletTxnId: true, status: true, demandStatus: true, result: true, moduleCode: true },
            })
          : Promise.resolve([]),
        fullTimeEnrollmentIds.length > 0
          ? prismaUnfiltered.fullTimeEnrollment.findMany({
              where: { id: { in: fullTimeEnrollmentIds } },
              select: { id: true, status: true },
            })
          : Promise.resolve([]),
        transactionIds.length > 0
          ? prismaUnfiltered.modularEnrollment.findMany({
              where: { walletTxnId: { in: transactionIds } },
              select: { id: true, walletTxnId: true, status: true },
            })
          : Promise.resolve([]),
        transactionIds.length > 0
          ? prismaUnfiltered.paymentMilestone.findMany({
              where: { walletTxnId: { in: transactionIds } },
              select: { id: true, walletTxnId: true, milestoneType: true, status: true },
            })
          : Promise.resolve([]),
      ])

    return NextResponse.json({
      data: serialized,
      meta: { total, page, limit },
      related: {
        payments: serializePrisma(relatedPayments),
        examBookings: serializePrisma(relatedExamBookings),
        fullTimeEnrollments: serializePrisma(relatedFullTimeEnrollments),
        modularEnrollments: serializePrisma(relatedModularEnrollments),
        milestones: serializePrisma(relatedMilestones),
      },
    })
  } catch (error) {
    console.error('[FINANCE_TRANSACTIONS_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
