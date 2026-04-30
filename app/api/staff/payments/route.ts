import { NextRequest, NextResponse } from 'next/server'
import prisma, { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const where: any = {}

  if (status && status !== 'ALL') {
    where.status = status
  }

  if (search) {
    where.OR = [
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
      { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
      { referenceCode: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [count, payments] = await Promise.all([
    prismaUnfiltered.payment.count({ where }),
    prismaUnfiltered.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            academyEmail: true,
            role: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return NextResponse.json({
    total: count,
    payments: serializePrisma(payments),
  })
}
