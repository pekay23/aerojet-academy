'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'

import { serializePrisma } from '@/lib/utils/serialization'

interface FetchApplicantsParams {
  tab?: string
  search?: string
  page?: string
  limit?: string
}

export async function fetchApplicants(params?: FetchApplicantsParams) {
  await requireStaff()

  const status = params?.tab ?? 'all'
  const search = (params?.search ?? '').trim()
  const page = Math.max(1, parseInt(params?.page ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(params?.limit ?? '25', 10) || 25))

  const where: Record<string, unknown> = {
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
    ;(where as Record<string, unknown>).registrationPaid = false
    ;(where as Record<string, unknown>).status = 'PENDING'
  } else if (status === 'pending_approval') {
    ;(where as Record<string, unknown>).registrationPaid = true
    ;(where as Record<string, unknown>).status = 'PENDING'
  } else {
    ;(where as Record<string, unknown>).status = 'PENDING'
  }

  const [applicants, total, allCount, pendingPaymentCount, pendingApprovalCount] =
    await Promise.all([
      prismaUnfiltered.user.findMany({
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
      prismaUnfiltered.user.count({ where }),
      prismaUnfiltered.user.count({ where: { role: 'APPLICANT', status: 'PENDING' } }),
      prismaUnfiltered.user.count({
        where: { role: 'APPLICANT', status: 'PENDING', registrationPaid: false },
      }),
      prismaUnfiltered.user.count({
        where: { role: 'APPLICANT', status: 'PENDING', registrationPaid: true },
      }),
    ])

  return {
    applicants: serializePrisma(applicants),
    meta: {
      total,
      page,
      limit,
      counts: {
        all: allCount,
        pending_payment: pendingPaymentCount,
        pending_approval: pendingApprovalCount,
      },
    },
  }
}
