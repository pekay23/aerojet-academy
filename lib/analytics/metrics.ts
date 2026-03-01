import prisma from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { getCurrencySymbol } from '@/lib/currency'

export const calculateFillRate = (current: number, max: number): number => {
  if (max === 0) return 0
  return Math.round((current / max) * 100)
}

export const formatCurrency = (
  amount: number | Prisma.Decimal | null,
  currency?: string
): string => {
  const value = Number(amount || 0)
  const curr = currency || 'EUR'
  const symbol = getCurrencySymbol(curr)
  return `${symbol}${value.toLocaleString()}`
}

export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function getDashboardMetrics() {
  const [
    totalUsers,
    totalStudents,
    totalApplicants,
    totalInstructors,
    activeEnrollments,
    pendingPayments,
    openPools,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.studentProfile.count(), // Better source for students
    prisma.user.count({ where: { role: 'APPLICANT' } }),
    prisma.instructorProfile.count(), // Better source for instructors
    prisma.enrollment.count({ where: { status: 'ENROLLED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.examPool.count({ where: { status: { in: ['OPEN', 'NEAR_FULL'] } } }),
    prisma.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amount: true } }),
  ])

  return {
    totalUsers,
    totalStudents,
    totalApplicants,
    totalInstructors,
    activeEnrollments,
    pendingPayments,
    openPools,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
  }
}

export async function getAttendanceRate(userId?: string) {
  const where: any = {}
  if (userId) where.userId = userId

  const [total, present] = await Promise.all([
    prisma.attendanceRecord.count({ where }),
    prisma.attendanceRecord.count({ where: { ...where, status: 'PRESENT' } }),
  ])

  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  return {
    total,
    present,
    absent: total - present,
    rate,
  }
}
