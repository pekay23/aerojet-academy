import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role === 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    // 1. Get Key Counts
    const pendingApps = await prisma.application.count({ where: { status: 'PENDING' } });
    const verifyingPayments = await prisma.fee.count({ where: { status: 'VERIFYING' } });
    const totalStudents = await prisma.student.count({ where: { enrollmentStatus: 'ENROLLED' } });
    const upcomingExams = await prisma.examRun.count({ where: { startDatetime: { gt: new Date() } } });

    // 2. Get Recent Activity (Combine latest apps and payments)
    const recentApps = await prisma.application.findMany({
      take: 3,
      orderBy: { appliedAt: 'desc' },
      include: { student: { include: { user: true } }, course: true }
    });

    const recentPayments = await prisma.fee.findMany({
      take: 3,
      where: { status: 'VERIFYING' },
      orderBy: { dueDate: 'desc' }, // Recently uploaded usually bumps updated_at, but we'll use logic
      include: { student: { include: { user: true } } }
    });

    return NextResponse.json({
      stats: { pendingApps, verifyingPayments, totalStudents, upcomingExams },
      activity: { recentApps, recentPayments }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
