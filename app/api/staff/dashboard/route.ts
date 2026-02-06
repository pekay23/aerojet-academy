import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Security Check: Only Admin and Staff allowed
    if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 🚀 PERFORMANCE OPTIMIZATION: Execute all independent queries in parallel
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
      nextWindow,
      upcomingExams,
      upcomingDeadlines,
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
      prisma.fee.count({ where: { status: 'VERIFYING' } }),

      // Data Fetches
      prisma.examWindow.findFirst({
        where: { endDate: { gt: new Date() } },
        include: {
          runs: {
            include: {
              course: true,
              bookings: { include: { student: { include: { fees: true } } } }
            }
          }
        },
        orderBy: { startDate: 'asc' }
      }),
      prisma.examRun.findMany({
        where: { startDatetime: { gte: new Date() } },
        include: { course: true },
        take: 10,
        orderBy: { startDatetime: 'asc' }
      }),
      prisma.examWindow.findMany({
        where: { endDate: { gte: new Date() } },
        take: 5
      }),
      prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, image: true } } }
      })
    ]);

    // --- Process Window Tracker ---
    let windowStats = null;
    if (nextWindow) {
      let paidSeatsCount = 0;
      nextWindow.runs.forEach(run => {
        run.bookings.forEach(booking => {
          const examFee = booking.student.fees.find(f => 
            f.description?.includes(run.course.code) && f.status === 'PAID'
          );
          if (examFee) paidSeatsCount++;
        });
      });

      const cutoff = new Date(nextWindow.cutoffDate);
      const diffDays = Math.ceil((cutoff.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      windowStats = {
        id: nextWindow.id,
        name: nextWindow.name,
        cutoff: nextWindow.cutoffDate,
        paidSeats: paidSeatsCount,
        targetSeats: nextWindow.minSeatsRequired,
        isGo: paidSeatsCount >= nextWindow.minSeatsRequired,
        daysToCutoff: diffDays > 0 ? diffDays : 0
      };
    }

    // --- Merge Calendar Events ---
    const calendarEvents = [
      ...upcomingExams.map(exam => ({
        id: exam.id,
        title: `Exam: ${exam.course.code}`,
        date: exam.startDatetime,
        type: 'EXAM'
      })),
      ...upcomingDeadlines.map(window => ({
        id: window.id,
        title: `Deadline: ${window.name}`,
        date: window.endDate,
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
