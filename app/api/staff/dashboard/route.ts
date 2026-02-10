import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Security Check
    if (!session || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 🚀 Execute all queries in parallel
    const [
      totalStudents,
      activeStudents,
      maleStudents,
      femaleStudents,
      totalStaff,
      totalInstructors,
      totalAdmins,
      pendingApps,
      verifyingPayments,
      nextEvent,
      upcomingPools,
      upcomingEvents,
      recentStudents,
      attendanceRecords,
      systemEvents
    ] = await Promise.all([
      // Student Counts
      prisma.user.count({ where: { role: 'STUDENT', isDeleted: false } }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true, isDeleted: false } }),
      prisma.student.count({ where: { gender: 'MALE', user: { isDeleted: false } } }),
      prisma.student.count({ where: { gender: 'FEMALE', user: { isDeleted: false } } }),

      // Team Counts
      prisma.user.count({ where: { role: 'STAFF', isDeleted: false } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR', isDeleted: false } }),
      prisma.user.count({ where: { role: 'ADMIN', isDeleted: false } }),

      // Ops Counts
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.fee.count({ where: { status: 'UNPAID' } }),

      // 1. Current/Next Exam Event 
      prisma.examEvent.findFirst({
        where: { endDate: { gt: new Date() } },
        include: {
          pools: {
            include: {
              memberships: {
                where: { status: { in: ['RESERVED', 'CONFIRMED'] } }
              }
            }
          }
        },
        orderBy: { startDate: 'asc' }
      }),

      // 2. Upcoming Pools
      prisma.examPool.findMany({
        where: { examDate: { gte: new Date() } },
        take: 10,
        orderBy: { examDate: 'asc' }
      }),

      // 3. Upcoming Event Deadlines
      prisma.examEvent.findMany({
        where: { endDate: { gte: new Date() } },
        take: 5
      }),

      // 4. Recent Students
      prisma.student.findMany({
        where: { user: { role: 'STUDENT', isDeleted: false } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, image: true } } }
      }),

      // 5. Recent Attendance (Last 30 Days)
      prisma.attendanceRecord.findMany({
        where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { status: true }
      }),

      // 6. Upcoming System Events
      (prisma as any).systemEvent.findMany({
        where: { end: { gte: new Date() } },
        take: 5,
        orderBy: { start: 'asc' }
      })
    ]);

    // --- Process Event Tracker (Go/No-Go) ---
    let windowStats = null;
    if (nextEvent) {
      let totalConfirmedSeats = 0;
      let totalRevenue = 0;
      nextEvent.pools.forEach((pool: any) => {
        const seats = pool.memberships.length;
        totalConfirmedSeats += seats;
        totalRevenue += seats * 300;
      });
      const cutoff = new Date(nextEvent.paymentDeadline);
      const diffDays = Math.ceil((cutoff.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const isGo = totalRevenue >= Number(nextEvent.minRevenueTarget);

      windowStats = {
        id: nextEvent.id,
        name: nextEvent.name,
        cutoff: nextEvent.paymentDeadline,
        paidSeats: totalConfirmedSeats,
        revenue: totalRevenue,
        targetRevenue: Number(nextEvent.minRevenueTarget),
        isGo: isGo,
        daysToCutoff: diffDays > 0 ? diffDays : 0
      };
    }

    // --- Process Calendar Events ---
    const calendarEvents = [
      ...upcomingPools.map((pool: any) => ({
        id: pool.id,
        title: `Pool: ${pool.name}`,
        date: pool.examDate,
        type: 'EXAM'
      })),
      ...upcomingEvents.map((event: any) => ({
        id: event.id,
        title: `Deadline: ${event.name}`,
        date: event.paymentDeadline,
        type: 'DEADLINE'
      })),
      ...systemEvents.map((event: any) => ({
        id: event.id,
        title: event.title,
        date: event.start,
        type: event.type
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // --- Calculate Attendance Rate ---
    const totalRecs = attendanceRecords.length;
    const presentRecs = attendanceRecords.filter((r: any) => r.status === 'PRESENT').length;
    const studentRate = totalRecs > 0 ? ((presentRecs / totalRecs) * 100).toFixed(1) : 0;

    // --- Return Consolidated Result ---
    return NextResponse.json({
      studentStats: { total: totalStudents, active: activeStudents, male: maleStudents, female: femaleStudents },
      teamStats: { staff: totalStaff, instructors: totalInstructors, admins: totalAdmins, total: totalStaff + totalInstructors + totalAdmins },
      opsStats: { pendingApps, verifyingPayments },
      windowTracker: windowStats,
      calendarEvents,
      recentStudents,
      attendance: {
        studentRate: studentRate,
        instructorRate: 98.5 // Hardcoded until we track instructor logins
      }
    });

  } catch (error) {
    console.error("DASHBOARD_API_ERROR:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
