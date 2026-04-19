import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { apiPaginated } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'all'
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: any = { role: 'STUDENT' }

  if (status === 'all') {
    where.status = { notIn: ['ARCHIVED', 'DELETED'] }
  } else if (status === 'active') where.status = 'ACTIVE'
  else if (status === 'suspended') where.status = 'SUSPENDED'
  else if (status === 'archived') where.status = 'ARCHIVED'

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { profile: { firstName: { contains: search, mode: 'insensitive' } } },
      { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      { studentProfile: { studentId: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        studentProfile: true,
        wallet: { select: { availableBalance: true, balance: true, currency: true } },
        enrollments: {
          include: { course: { select: { code: true, name: true } } },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return apiPaginated(students, total, page, limit)
}
