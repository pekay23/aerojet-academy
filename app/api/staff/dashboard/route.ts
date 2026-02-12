import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // 1. Security Check
    const user = session?.user as { role: string; id: string } | undefined;
    if (!user || !['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 🚀 INSTRUCTOR DASHBOARD
    if (user.role === 'INSTRUCTOR') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [myClasses, todayAttendance, recentGrades, upcomingEvents] = await Promise.all([
        // Classes assigned to this instructor via CohortCourse
        prisma.cohortCourse.findMany({
          where: { instructors: { some: { id: user.id } } },
          include: {
            course: { select: { id: true, code: true, title: true } },
            cohort: {
              select: {
                id: true, name: true, code: true,
                _count: { select: { students: true } }
              }
            }
          }
        }),

        // Today's attendance records by this instructor
        prisma.attendanceRecord.findMany({
          where: {
            recordedBy: user.id,
            date: { gte: today, lt: tomorrow }
          },
          select: { status: true }
        }),

        // Recent grades recorded by this instructor
        prisma.assessment.findMany({
          where: { gradedBy: user.id },
          take: 5,
          orderBy: { recordedAt: 'desc' },
          include: {
            student: {
              include: { user: { select: { name: true } } }
            }
          }
        }),

        // Upcoming system events
        prisma.systemEvent.findMany({
          where: { start: { gte: new Date() } },
          take: 5,
          orderBy: { start: 'asc' }
        })
      ]);

      const totalStudents = myClasses.reduce((sum: number, cc: any) => sum + (cc.cohort?._count?.students || 0), 0);
      const todayPresent = todayAttendance.filter((a: any) => a.status === 'PRESENT').length;
      const todayTotal = todayAttendance.length;

      return NextResponse.json({
        role: 'INSTRUCTOR',
        stats: {
          classes: myClasses.length,
          students: totalStudents,
          todayAttendance: { present: todayPresent, total: todayTotal },
          gradesRecorded: recentGrades.length
        },
        myClasses: myClasses.map((cc: any) => ({
          id: cc.id,
          courseId: cc.course.id,
          courseCode: cc.course.code,
          courseTitle: cc.course.title,
          cohortName: cc.cohort.name,
          cohortCode: cc.cohort.code,
          studentCount: cc.cohort._count.students
        })),
        recentGrades: recentGrades.map((g: any) => ({
          id: g.id,
          studentName: g.student?.user?.name || 'Unknown',
          moduleCode: g.moduleCode,
          score: g.score,
          isPassed: g.isPassed,
          recordedAt: g.recordedAt
        })),
        calendarEvents: upcomingEvents.map((e: any) => ({ id: e.id, title: e.title, date: e.start, type: e.type }))
      });
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
        select: { status: true, date: true, recordedBy: true }
      }),

      // 6. Upcoming System Events
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      ...systemEvents.map((event: { id: string; title: string; start: Date; type: string }) => ({
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

    // --- Calculate Instructor Attendance Rate ---
    // Count distinct instructors who recorded attendance in the last 30 days
    // Calculate working days in last 30 days (approx 22 weekdays)
    const workingDays = 22;
    const instructorCount = totalInstructors || 1;
    const expectedRecords = workingDays * instructorCount;
    // Distinct days instructors logged attendance
    const instructorDays = new Set(
      attendanceRecords.map((r: any) => `${r.recordedBy}-${new Date(r.date).toDateString()}`)
    );
    const instructorRate = expectedRecords > 0
      ? Math.min(100, ((instructorDays.size / expectedRecords) * 100)).toFixed(1)
      : 0;

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
        instructorRate: instructorRate
      }
    });

  } catch (error) {
    console.error("DASHBOARD_API_ERROR:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
