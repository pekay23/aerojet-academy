import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { apiPaginated, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // pending_payment | pending_docs | pending_approval | all
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: any = {
    role: 'APPLICANT',
    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { registrationCode: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  if (status === 'pending_payment') {
    where.registrationPaid = false
    where.status = 'PENDING'
  } else if (status === 'pending_approval') {
    where.registrationPaid = true
    where.status = 'PENDING'
  } else {
    // Show all PENDING except ARCHIVED/DELETED (effectively mostly PENDING anyway)
    where.status = 'PENDING'
  }

  const [applicants, total, allCount, pendingPaymentCount, pendingApprovalCount] =
    await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          payments: {
            where: { referenceType: 'REGISTRATION' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { role: 'APPLICANT', status: 'PENDING' } }),
      prisma.user.count({
        where: { role: 'APPLICANT', status: 'PENDING', registrationPaid: false },
      }),
      prisma.user.count({
        where: { role: 'APPLICANT', status: 'PENDING', registrationPaid: true },
      }),
    ])

  return apiPaginated(applicants, total, page, limit, {
    counts: {
      all: allCount,
      pending_payment: pendingPaymentCount,
      pending_approval: pendingApprovalCount,
    },
  })
})
