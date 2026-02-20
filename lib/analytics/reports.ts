import prisma from '@/lib/prisma/client'

export async function getEnrollmentTrends() {
  const enrollmentsByCourse = await prisma.enrollment.groupBy({
    by: ['courseId'],
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
  })

  const courses = await prisma.course.findMany({
    where: { id: { in: enrollmentsByCourse.map((e) => e.courseId) } },
    select: { id: true, name: true, code: true },
  })

  return enrollmentsByCourse.map((item) => {
    const course = courses.find((c) => c.id === item.courseId)
    return {
      courseName: course?.name || 'Unknown Course',
      courseCode: course?.code || 'N/A',
      count: item._count.userId,
    }
  })
}

export async function getRevenueReport() {
  const recentPayments = await prisma.payment.findMany({
    where: { status: 'APPROVED' },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      user: { include: { profile: true } },
    },
  })

  // Group revenue by month for chart (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const paymentsForChart = await prisma.payment.findMany({
    where: {
      status: 'APPROVED',
      updatedAt: { gte: sixMonthsAgo },
    },
    select: { amount: true, updatedAt: true },
  })

  const monthlyRevenue: Record<string, number> = {}
  paymentsForChart.forEach((p) => {
    const month = p.updatedAt.toLocaleString('default', { month: 'short' })
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(p.amount)
  })

  const chartData = Object.entries(monthlyRevenue).map(([name, total]) => ({ name, total }))

  const totalRevenue = await prisma.payment.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true },
  })

  return {
    recentPayments,
    chartData,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
  }
}

export async function getPoolAnalytics() {
  const pools = await prisma.examPool.findMany({
    orderBy: { examDate: 'desc' },
    include: {
      event: { select: { name: true } },
    },
    take: 50,
  })

  // Format for chart
  const chartData = pools.map((pool) => ({
    name: pool.name,
    fill: Math.round((pool.currentMemberCount / pool.maxCandidates) * 100),
    count: pool.currentMemberCount,
    capacity: pool.maxCandidates,
  }))

  return { pools, chartData }
}

export async function getAttendanceReport() {
  const records = await prisma.attendanceRecord.findMany({
    take: 50,
    orderBy: { date: 'desc' },
    include: {
      user: { include: { profile: true } },
      class: { select: { name: true } },
    },
  })

  // Status breakdown for chart
  const stats = await prisma.attendanceRecord.groupBy({
    by: ['status'],
    _count: { id: true },
  })

  const chartData = stats.map((s) => ({
    name: s.status,
    value: s._count.id,
  }))

  return { records, chartData }
}
