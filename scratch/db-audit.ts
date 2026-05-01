import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function main() {
  const summary = {
    totalUsers: await prisma.user.count(),
    roles: await prisma.user.groupBy({ by: ['role'], _count: true }),
    statuses: await prisma.user.groupBy({ by: ['status'], _count: true }),
    pathways: await prisma.studentProfile.groupBy({ by: ['enrollmentType'], _count: true }),
    enrollments: await prisma.enrollment.count(),
    ftEnrollments: await prisma.fullTimeEnrollment.count(),
    transactions: await prisma.walletTransaction.count(),
    grades: await prisma.grade.count(),
    examResults: await prisma.examResult.count(),
    attendance: await prisma.attendanceRecord.count(),
    examBookings: await prisma.examBooking.count(),
    examSittings: await prisma.examSitting.count(),
    examPools: await prisma.examPool.count(),
    notifications: await prisma.notification.count(),
    messages: await prisma.message.count(),
    referrals: await prisma.referral.count(),
    invoices: await prisma.invoice.count(),
    bundles: await prisma.examBundle.count(),
    applicants: await prisma.user.count({ where: { role: 'APPLICANT' } }),
    examiners: await prisma.examiner.count()
  }
  console.log(JSON.stringify(summary, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
