import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Security Check
    if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
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
      nextEvent,      // Was nextWindow
      upcomingPools,  // Was upcomingExams
      upcomingEvents, // Was upcomingDeadlines
      recentStudents
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
      prisma.fee.count({ where: { status: 'UNPAID' } }), // Adjusted from VERIFYING if needed

      // 1. Current/Next Exam Event (Replaces Window)
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

      // 2. Upcoming Pools (Replaces Runs)
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
        where: {
            user: { role: 'STUDENT', isDeleted: false }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, image: true } } }
      })
    ]);

    // --- Process Event Tracker (Go/No-Go) ---
    let windowStats = null;
    
    if (nextEvent) {
      // Calculate revenue/seats from Pools
      let totalConfirmedSeats = 0;
      let totalRevenue = 0;

      nextEvent.pools.forEach(pool => {
         const seats = pool.memberships.length;
         totalConfirmedSeats += seats;
         // Estimate revenue (assuming 300 per seat for now)
         totalRevenue += seats * 300; 
      });

      const cutoff = new Date(nextEvent.paymentDeadline); // T-21
      const diffDays = Math.ceil((cutoff.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      // Threshold logic: €25,000 revenue target
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

    // --- Merge Calendar Events ---
    const calendarEvents = [
      ...upcomingPools.map(pool => ({
        id: pool.id,
        title: `Pool: ${pool.name}`,
        date: pool.examDate, // Use examDate instead of startDatetime
        type: 'EXAM'
      })),
      ...upcomingEvents.map(event => ({
        id: event.id,
        title: `Deadline: ${event.name}`,
        date: event.paymentDeadline, // Track Payment Deadline
        type: 'DEADLINE'
      }))
    ];

    // --- Return Consolidated Result ---
    return NextResponse.json({
      studentStats: { total: totalStudents, active: activeStudents, male: maleStudents, female: femaleStudents },
      teamStats: { staff: totalStaff, instructors: totalInstructors, admins: totalAdmins },
      opsStats: { pendingApps, verifyingPayments },
      windowTracker: windowStats,
      calendarEvents,
      recentStudents
    });

  } catch (error) {
    console.error("DASHBOARD_API_ERROR:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
