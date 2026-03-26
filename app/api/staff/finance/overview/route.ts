import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function GET(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalRegistration,
    totalCourse,
    monthRegistration,
    monthCourse,
    lastMonthRegistration,
    lastMonthCourse,
    pendingCount,
    pendingTotal,
    recentTransactions,
  ] = await Promise.all([
    // All-time approved total - Registration (GHS)
    // Sum originalAmount if it's GHS, otherwise sum amount (EUR)
    prisma.payment.aggregate({
      where: { status: 'APPROVED', referenceType: 'REGISTRATION' },
      _sum: { amount: true, originalAmount: true },
    }),
    // All-time approved total - Course/Exams (EUR)
    prisma.payment.aggregate({
      where: { status: 'APPROVED', referenceType: { in: ['COURSE', 'EXAM'] } },
      _sum: { amount: true },
    }),
    // This month - Registration
    prisma.payment.aggregate({
      where: {
        status: 'APPROVED',
        referenceType: 'REGISTRATION',
        approvedAt: { gte: startOfMonth },
      },
      _sum: { amount: true, originalAmount: true },
    }),
    // This month - Course
    prisma.payment.aggregate({
      where: {
        status: 'APPROVED',
        referenceType: { in: ['COURSE', 'EXAM'] },
        approvedAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    // Last month - Registration
    prisma.payment.aggregate({
      where: {
        status: 'APPROVED',
        referenceType: 'REGISTRATION',
        approvedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true, originalAmount: true },
    }),
    // Last month - Course
    prisma.payment.aggregate({
      where: {
        status: 'APPROVED',
        referenceType: { in: ['COURSE', 'EXAM'] },
        approvedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    }),
    // Recent transactions
    prisma.payment.findMany({
      where: { status: { in: ['APPROVED', 'REJECTED', 'PENDING'] } },
      include: {
        user: {
          include: { profile: { select: { firstName: true, middleName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return NextResponse.json({
    totalRegistration: Number(
      totalRegistration._sum.originalAmount ?? totalRegistration._sum.amount ?? 0
    ),
    totalCourse: Number(totalCourse._sum.amount ?? 0),
    monthRegistration: Number(
      monthRegistration._sum.originalAmount ?? monthRegistration._sum.amount ?? 0
    ),
    monthCourse: Number(monthCourse._sum.amount ?? 0),
    lastMonthRegistration: Number(
      lastMonthRegistration._sum.originalAmount ?? lastMonthRegistration._sum.amount ?? 0
    ),
    lastMonthCourse: Number(lastMonthCourse._sum.amount ?? 0),
    pendingCount,
    pendingTotal: Number(pendingTotal._sum.amount ?? 0),
    recentTransactions,
  })
}
